const db = require("../config/db")
const User = require("../models/user.model")
const Op = db.Sequelize.Op
const fs = require('fs');
const helperFunction = require("../utils/helperFunction")


exports.create = async (req, res) => {
    try {
        // Validate request
        if (!req.body.email) {
            return helperFunction.clientErrorResponse(res, "Email is required.")
        }

        // Create a User object
        const user = {
            name: req.body.name,
            email: req.body.email,
            bio: req.body.bio || "",
            panCard: req.body.panCard || "",
            addharCard: req.body.addharCard || ""
        };

        // Save User in the database
        const data = await User.create(user);
        return helperFunction.dataResponse(res, data, "user created successfully")
    } catch (err) {
        return helperFunction.errorResponse(res, err, "user cannot be created")
    }
};

exports.findAll = async (req, res) => {
    const name = req.query.name;
    const condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

    try {
        const data = await User.findAll({ where: condition });
        return helperFunction.dataResponse(res, data);
    } catch (err) {
        return helperFunction.errorResponse(res, err, "Some error occurred while retrieving User.");
    }
};


// Find a single User with an id
exports.findOne = async (req, res) => {
    const id = req.params.id;

    try {
        const data = await User.findByPk(id);
        if (data) {
            return helperFunction.dataResponse(res, data);
        } else {
            return helperFunction.clientErrorResponse(res, `Cannot find User with id=${id}.`);
        }
    } catch (err) {
        return helperFunction.errorResponse(res, err, `Error retrieving User with id=${id}`);
    }
};


// Update a User by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return helperFunction.clientErrorResponse(res, "User ID is required.");
    }

    try {
        // Find the user by ID
        const user = await User.findByPk(id);
        if (!user) {
            return helperFunction.clientErrorResponse(res, "User not found with ID " + id);
        }

        if (!req.file) {
            return helperFunction.clientErrorResponse(res, "No image uploaded.");
        }
        // Get the file extension from the original filename
        const fileExtension = req.file.originalname.split('.').pop();
        // const newPath = `${req.file.destination}/${user.id}`;
        // // Define the new path for the image with the user ID and file extension
        const newPath = `${req.file.destination}/${user.id}.${fileExtension}`;

        // // Rename and move the image file
        // await fs.rename(req.file.path, newPath);

        // Update user's image path
        const [numRowsUpdated] = await User.update({ image: newPath }, { where: { id: id } });

        if (numRowsUpdated === 1) {
            // Fetch the updated user
            const updatedUser = await User.findByPk(id);
            return helperFunction.dataResponse(res, updatedUser);
        } else {
            return helperFunction.clientErrorResponse(res, "User not found with ID " + id);
        }
    } catch (err) {
        return helperFunction.errorResponse(res, err, "Error occurred while updating user.");
    }
};



// Delete a User with the specified id in the request
exports.delete = async (req, res) => {
    const id = req.params.id;

    try {
        const num = await User.destroy({ where: { id: id } });
        if (num == 1) {
            return helperFunction.dataResponse(res, null, "User was deleted successfully!");
        } else {
            return helperFunction.clientErrorResponse(res, `Cannot delete User with id=${id}. Maybe User was not found!`);
        }
    } catch (err) {
        return helperFunction.errorResponse(res, err, `Could not delete User with id=${id}`);
    }
};




// find all User Tutorial
exports.findAllUser = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const offset = (page - 1) * limit;

        const data = await User.findAll({
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
        });

        const totalCount = await User.count();
        const remainingCount = Math.max(totalCount - offset - limit, 0);

        return helperFunction.dataResponse(res, { users: data, limit: limit, totalCount: totalCount, remainingCount: remainingCount }, "all user data is fatched successfully");
    } catch (err) {
        return helperFunction.errorResponse(res, err, "Some error occurred while retrieving User.");
    }
};




//upload multiy image
exports.uploadImages = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return helperFunction.clientErrorResponse(res, 'User ID is required.');
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return helperFunction.clientErrorResponse(res, `User not found with ID ${userId}`);
        }

        if (!req.files || req.files.length === 0) {
            return helperFunction.clientErrorResponse(res, 'No images uploaded.');
        }

        const proofDir = `profileImage/proof`;

        // await fs.mkdir(proofDir, { recursive: true });

        // Process each uploaded image sequentially
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fieldname = file.fieldname; // Get the fieldname of the uploaded file
            const newPath = `${proofDir}/${file.filename}`; // Path for the uploaded file inside the proof directory

            // Move the image file to the proof directory
            // await fs.rename(file.path, newPath);

            // Update user's image path in the database
            user[fieldname] = newPath;

            // Save updated user object with new image path
            await user.save();
        }

        return helperFunction.dataResponse(res, user);
    } catch (err) {
        return helperFunction.errorResponse(res, err, 'Error occurred while uploading images.');
    }
};




//create user and uploading image by using exress-fileupload
exports.createUser = async (req, res) => {
    try {
        const userData = req.body;

        if (!req.files || !req.files.image) {
            return helperFunction.clientErrorResponse(res, 'No image file was uploaded.');
        }

        const imageFile = req.files.image;
        const uploadPath = __dirname + '/profileImage' + imageFile.name;

        imageFile.mv(uploadPath, async function (err) {
            if (err) {
                return helperFunction.errorResponse(res, err.message || 'An error occurred while uploading the image.', 'File Upload Error');
            }

            const user = {
                name: userData.name,
                email: userData.email,
                image: '/profileImage/' + imageFile.name,
                bio: userData.bio || "",
                panCard: userData.panCard || "",
                addharCard: userData.addharCard || ""
            };

            // Save User in the database
            const createdUser = await User.create(user);
            return helperFunction.dataResponse(res, createdUser, "User created successfully");

        });
    } catch (err) {
        return helperFunction.errorResponse(res, err.message, 'User Not created');
    }
};
