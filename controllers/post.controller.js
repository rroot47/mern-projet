const postModel = require('../models/post.model');
const UserModel = require('../models/user.model');
const ObjectID = require('mongoose').Types.ObjectId;
const { uploadError } = require('../utils/errors.utils')
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const fs = require('fs');

module.exports.getAllPosts = (req, res) => {
  postModel.find((err, docs) => {
    if (!err) res.send(docs);
    else console.log(err);
  }).sort({ createdAt: -1 });
};

module.exports.addPost = async (req, res) => {
  let fileName;

  if (req.file !== null) {
    try {
      if (
        req.file.detectedMimeType !== "image/jpg" &&
        req.file.detectedMimeType !== "image/png" &&
        req.file.detectedMimeType !== "image/jpeg"
      )
        throw Error("invalid file");

      if (req.file.size > 500000) throw Error('max size');
    } catch (error) {
      const errors = uploadError(error)
      return res.status(201).json({ errors });
    }
    fileName = req.body.posterId + Date.now() + '.jpg';
    await pipeline(
      req.file.stream,
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/posts/${fileName}`
      )
    );
  }

  const newPost = new postModel({
    posterId: req.body.posterId,
    message: req.body.message,
    picture: req.file !== null ? "./uploads/posts/" + fileName : "",
    video: req.body.video,
    likes: [],
    comments: []
  });
  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (error) {
    return res.status(400).send(error);
  }
};

module.exports.updatePost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  const updatedMessage = {
    message: req.body.message
  };

  postModel.findByIdAndUpdate(
    req.params.id,
    { $set: updatedMessage },
    { new: true },
    (err, docs) => {
      if (!err) res.send(docs);
      else console.log(err);
    }
  )
};

module.exports.deletePost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  postModel.findByIdAndDelete(req.params.id, (err, docs) => {
    if (!err) res.send({ postDeleteID: docs.id });
    else console.log(err.toString());
  });
};

module.exports.likePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    await postModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { likers: req.body.id } },
      { new: true },
      (err, docs) => {
        if (err) return res.status(400).send(err);
      });
    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $addToSet: { likers: req.params.id } },
      { new: true },
      (err, docs) => {
        if (!err) res.send(docs);
        else return res.status(400).send(err.toString());
      });
  } catch (error) {
    return res.status(400).send(error);
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    await postModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { likers: req.body.id } },
      { new: true },
      (err, docs) => {
        if (err) return res.status(400).send(err);
      });
    await UserModel.findByIdAndUpdate(
      req.body.id,
      { $pull: { likers: req.params.id } },
      { new: true },
      (err, docs) => {
        if (!err) res.send(docs);
        else return res.status(400).send(err.toString());
      });
  } catch (error) {
    return res.status(400).send(error);
  }
};

module.exports.commentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    return postModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          }
        }
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (error) {
    return res.status(400).send(err);
  }
};

module.exports.editCommentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    return postModel.findById(
      req.params.id,
      (err, docs) => {
        const thsComment = docs.comments.find((comment) => comment._id.equals(req.body.commentId));
        if (!thsComment) return res.status(400).send('Comment nit found');
        thsComment.text = req.body.text;

        return docs.save((err) => {
          if (!err) return res.status(200).send(docs);
          return res.status(500).send(err);
        });
      }
    )
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports.deleteCommentPost = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    return postModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId
          }
        }
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (error) {
    return res.status(400).send(error);
  }
};  