/**
 * @module routes/api/comments
 * @description Express router for handling comment-related API endpoints.
 *
 * Routes:
 * - POST   /                Create a new comment.
 * - GET    /:postId         Retrieve all comments for a specific post.
 * - DELETE /:commentId      Delete a comment by its ID (owner only).
 * - PUT    /:commentId      Update a comment by its ID (owner only).
 * - GET    /comment/:commentId Retrieve a single comment by its ID.
 * - GET    /user/:userId    Retrieve all comments made by a specific user.
 * - GET    /paginate        Retrieve comments with pagination.
 * - GET    /search          Search comments by content (case-insensitive).
 * - POST   /:commentId/like Like a comment.
 * - POST   /:commentId/unlike Unlike a comment.
 * - GET    /keyword         Retrieve comments containing a specific keyword.
 * - DELETE /delete/:commentId Delete a comment by its ID (owner only).
 *
 * All routes expect authentication middleware to set req.user for user-specific actions.
 *
 * @requires express
 * @requires mongoose
 * @requires Comment (Mongoose model)
 */
const router = require("express").Router();
const mongoose = require("mongoose");
const Comment = mongoose.model("Comment");

module.exports = router;
//Hey GitHub Copilot, //I want you to write a route that will handle the creation of a comment.
router.post("/", async (req, res) => {
    try {
        const { content, postId } = req.body;
        if (!content || !postId) {
            return res.status(400).json({ error: "Content and postId are required" });
        }

        const comment = new Comment({
            content,
            post: postId,
            user: req.user._id, // Assuming req.user is set by authentication middleware
        });

        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
);
//Hey GitHub Copilot, //I want you to write a route that will handle the retrieval of comments for a specific post.
router.get("/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({ error: "postId is required" });
        }

        const comments = await Comment.find({ post: postId })
            .populate("user", "username") // Populate user field with username
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error retrieving comments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
//Hey GitHub Copilot, //I want you to write a route that will handle the deletion of a comment.
router.delete("/:commentId", async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ error: "commentId is required" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user is the owner of the comment
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        await comment.remove();
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
//Hey GitHub Copilot, //I want you to write a route that will handle the updating of a comment.
router.put("/:commentId", async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!commentId || !content) {
            return res.status(400).json({ error: "commentId and content are required" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user is the owner of the comment
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to update this comment" });
        }

        comment.content = content;
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
//Hey GitHub Copilot, //I want you to write a route that will handle the retrieval of a single comment by its ID.
router.get("/comment/:commentId", async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ error: "commentId is required" });
        }

        const comment = await Comment.findById(commentId)
            .populate("user", "username"); // Populate user field with username

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.status(200).json(comment);
    } catch (error) {
        console.error("Error retrieving comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Hey GitHub Copilot, //I want you to write a route that will handle the retrieval of all comments made by a specific user.
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const comments = await Comment.find({ user: userId })
            .populate("post", "title") // Populate post field with title
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error retrieving user comments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Hey GitHub Copilot, //I want you to write a route that will handle the retrieval of comments with pagination.
router.get("/paginate", async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const comments = await Comment.find()
            .populate("user", "username") // Populate user field with username
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .skip(skip)
            .limit(Number(limit));

        const totalComments = await Comment.countDocuments();
        res.status(200).json({
            comments,
            totalPages: Math.ceil(totalComments / limit),
            currentPage: Number(page),
        });
    } catch (error) {
        console.error("Error retrieving paginated comments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
routee.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Query parameter is required" });
        }

        const comments = await Comment.find({ content: new RegExp(query, "i") }) // Case-insensitive search
            .populate("user", "username") // Populate user field with username
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error searching comments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
);
// Hey GitHub Copilot, //I want you to write a route that will handle the liking of a comment.
router.post("/:commentId/like", async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ error: "commentId is required" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user has already liked the comment
        if (comment.likes.includes(req.user._id)) {
            return res.status(400).json({ error: "You have already liked this comment" });
        }

        comment.likes.push(req.user._id);
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Hey GitHub Copilot, //I want you to write a route that will handle the unliking of a comment.
router.post("/:commentId/unlike", async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ error: "commentId is required" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user has liked the comment
        const likeIndex = comment.likes.indexOf(req.user._id);
        if (likeIndex === -1) {
            return res.status(400).json({ error: "You have not liked this comment" });
        }

        comment.likes.splice(likeIndex, 1);
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        console.error("Error unliking comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Hey GitHub Copilot, //I want you to write a route that will handle the retrieval of comments with a specific keyword in their content.
router.get("/keyword", async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) {
            return res.status(400).json({ error: "Keyword parameter is required" });
        }

        const comments = await Comment.find({ content: new RegExp(keyword, "i") }) // Case-insensitive search
            .populate("user", "username") // Populate user field with username
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error retrieving comments by keyword:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// add another endpoint for deleting a comment by its ID
router.delete("/delete/:commentId", async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ error: "commentId is required" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Check if the user is the owner of the comment
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        await comment.remove();
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});