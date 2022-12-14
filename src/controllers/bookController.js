const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const mongoose = require("mongoose")
const reviweModel = require("../models/reviewModel")


const isValidType = function (value) {
    if (typeof value !== "string" || value.trim().length === 0) {
        return false;
    }
    return true;
};



const createBooks = async function (req, res) {
    try {
        const ISBNRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
        const isValidDate = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))+$/
        data = req.body

        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt, isDeleted } = data

        if (Object.keys(data).length === 0) return res.status(400).send({ status: false, message: "Please Provide Details" })

        if (!title) return res.status(400).send({ status: false, message: "Please Provide Title" })

        if (!isValidType(title)) return res.status(400).send({ status: false, message: "provide title in string" })

        let duplicateTitle = await bookModel.findOne({ title })

        if (duplicateTitle) return res.status(400).send({ status: false, message: "title is already registered!" })

        if (!excerpt) return res.status(400).send({ status: false, message: "Please Provide Excerpt" })

        if (!isValidType(excerpt)) return res.status(400).send({ status: false, message: "provide excerpt is string" })

        if (!userId) return res.status(400).send({ status: false, message: "Please Provide userId" })

        if (!mongoose.Types.ObjectId.isValid(userId)) {                                                                // userId Validation
            return res.status(403).send({ status: false, message: "Please Provide Valid userId" })
        }
        if (!ISBN) return res.status(400).send({ status: false, message: "Please Provide ISBN" })

        if (!isValidType(ISBN)) return res.status(400).send({ status: false, message: "please provide ISBN string" })

        if (!ISBNRegex.test(ISBN)) return res.status(400).send({ status: false, message: "Please Provide Valid ISBN" })

        let duplicateISBN = await bookModel.findOne({ ISBN })

        if (duplicateISBN) return res.status(400).send({ status: false, message: "ISBN is already registered!" })

        if (!category) return res.status(400).send({ status: false, message: "Please Provide Category" })

        if (!isValidType(category)) return res.status(400).send({ status: false, message: "please provide category string" })

        if (!subcategory) return res.status(400).send({ status: false, message: "Please Provide Subcategory" })

        if (!isValidType(subcategory)) return res.status(400).send({ status: false, message: "please provide subcategory string" })

        if (!releasedAt) return res.status(400).send({ status: false, message: "Please Provide releasedAt" })

        if (!isValidDate.test(releasedAt)) return res.status(400).send({ status: false, message: "Please enter releasedAt in the right format(YYYY-MM-DD)!" })

        if (isDeleted === true) {
            data.deletedAt = new Date()
        }
        const bookCreation = await bookModel.create(data)
        res.status(201).send({ status: true, message: "Book Created Successfully", data: bookCreation })

    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


const getBooks = async function (req, res) {
    try {
        let data = req.query;

        const { userId, category, subcategory } = data
        if (Object.keys(data).length == 0) {
            let findBookwithoutfilter = await bookModel.find({ isDeleted: false }).select({ title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })
            findBookwithoutfilter.sort((a, b) => a.title.localeCompare(b.title))
            return res.status(200).send({ status: true, message: 'Books fetch is successful', data: findBookwithoutfilter })

        }

        const obj = {}
        if (userId) {
            if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is not valid" })

            let alluser = await userModel.findById(userId)

            if (!alluser) return res.status(404).send({ status: false, message: "user not found" })
            obj.userId = userId
        }
        if (category) {
            obj.category = category
        }
        if (subcategory) {
            obj.subcategory = subcategory
        }

        const allbooks = { ...obj, isDeleted: false }

        if (!(userId || category || subcategory)) {
            return res.status(400).send({ satus: false, message: "Please Provide Only userId,Category,Subcategory" })
        }

        const getallbooks = await bookModel.find(allbooks).select({ title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).sort({ title: 1 })

        if (getallbooks.length == 0) return res.status(404).send({ satus: false, message: "No book is found" })

        getallbooks.sort((a, b) => a.title.localeCompare(b.title))

        return res.status(200).send({ status: true, message: 'Books fetch is successful', data: getallbooks })

    } catch (err) {

        return res.status(500).send({ status: false, message: "server error", error: err.message })
    }
}

// get all book by id

const getallBooksById = async function (req, res) {

    try {
        let bookId = req.params.bookId

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ satus: false, message: "bookId is not valid" })

        let allbook = await bookModel.findById(bookId)
        if (!allbook) return res.status(404).send({ satus: false, message: "bookId does not Exist" })

        let result = await bookModel.findOne({ _id: bookId, isDeleted: false })

        if (!result) return res.status(404).send({ status: false, message: "Book Not Found Or Deleted" })

        let Book = result._id;

        const review = await reviweModel.find({ bookId: Book }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })

        responsedata = {
            _id: result._id,
            title: result.title,
            excerpt: result.excerpt,
            userId: result.userId,
            category: result.category,
            subcategory: result.subcategory,
            isDeleted: result.isDeleted,
            reviews: result.reviews,
            releasedAt: result.releasedAt,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            reviewsData: review
        }
        return res.status(200).send({ status: true, message: "Book details is successful", data: responsedata })
    } catch (err) {
        res.status(500).send({ status: false, message: "server error", error: err.message })

    }
}

// ***********************************************put api****************************************************************************

const updatedocutment = async function (req, res) {
    try {

        const ISBNRegex = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
        const isValidDate = /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))+$/

        const bodydata = req.body
        let bookId = req.params.bookId

        const { title, excerpt, releasedAt, ISBN } = bodydata
        let obj = {}

        if (title) {
            obj.title = title
        }
        if (excerpt) {
            obj.excerpt = excerpt
        }
        if (releasedAt) {
            obj.releasedAt = releasedAt
        }
        if (ISBN) {
            obj.ISBN = ISBN
        }

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "please provide valid bookId" })
        if (Object.keys(bodydata).length == 0) return res.status(400).send({ satus: false, message: "for updation data is required" })

        if (!(title || excerpt || releasedAt || ISBN)) {
            return res.status(400).send({ satus: false, message: "only update title, excerpt, releasedAt, ISBN" })
        }
        if (excerpt) {
            if (!isValidType(excerpt)) return res.status(400).send({ status: false, message: "please provide excerpt string" })
        }
        let noData = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!noData) return res.status(404).send({ satus: false, message: "No Book Found Or Deleted" })
        if (title) {
            if (!isValidType(title)) return res.status(400).send({ status: false, message: "please provide title string" })
            let duplicateTitle = await bookModel.findOne({ title })
            if (duplicateTitle) return res.status(400).send({ status: false, message: "title is already registered!" })
        }
        if (ISBN) {

            if (!isValidType(ISBN)) return res.status(400).send({ status: false, message: "please provide ISBN string" })

            let duplicateISBN = await bookModel.findOne({ ISBN })
            if (duplicateISBN) return res.status(400).send({ status: false, message: "ISBN is already registered!" })

            if (!ISBNRegex.test(ISBN)) return res.status(400).send({ status: false, message: "Please enter Valid ISBN!" })
        }
        if (releasedAt) {
            if (!isValidDate.test(releasedAt)) return res.status(400).send({ status: false, message: "Please enter releasedAt in the right format(YYYY-MM-DD)!" })
        }
        const updateBook = await bookModel.findByIdAndUpdate({ _id: noData._id }, { $set: obj }, { new: true })

        return res.status(200).send({ status: true, message: "Book update is successful", data: updateBook })

    } catch (err) {
        return res.status(500).send({ status: false, message: "server error", Error: err.message })
    }
}
// ************************************************delete by id*****************************************************************

const deletebook = async function (req, res) {
    try {
        const bookId = req.params.bookId

        if (!mongoose.isValidObjectId(bookId)) return res.status(400).send({ satus: false, message: "provide valid object Id" })

        let dbcall = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!dbcall) return res.status(404).send({ satus: false, message: "No Book Found Or Deleted" })

        const updateBook = await bookModel.findOneAndUpdate({ _id: bookId }, { isDeleted: true, deletedAt: new Date() }, { new: true })

        return res.status(200).send({ status: true, message: "data deleted sucessfully" })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: "server error", error: err.message })
    }
}
module.exports = { createBooks, getBooks, getallBooksById, updatedocutment, deletebook }