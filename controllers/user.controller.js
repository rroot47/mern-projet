const UserModel = require('../models/user.model');
const ObjectID = require('mongoose').Types.ObjectId;

//recuperer tout les utilisateur 
module.exports.getAllUsers = async (req, res) => {
  const users = await UserModel.find().select('-password');
  res.status(200).json(users);
};

//recuperer les infos d'un utilisateur par id
module.exports.getUsersInfo = async (req, res) => {

  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  UserModel.findById(req.params.id, (err, docs) => {
    if (!err) res.send(docs);
    else console.log('Id unknown : ' + err);
  }).select('-password')
};

//modifier un user
module.exports.updateUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    await UserModel.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $set: { bio: req.body.bio }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        if (err) return res.status(500).send({ message: err });
      }
    )
  } catch (error) {
    return res.status(500).json({ message: err });
  }
};

//supprimer un user
module.exports.deleteUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send('Id unknown : ' + req.params.id);

  try {
    await UserModel.remove({ _id: req.params.id }).exec();
    res.status(200).json({ message: 'Successfully deleted. ' })
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

//abonner un user
module.exports.followUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id) || !ObjectID.isValid(req.body.idToFollow))
    return res.status(400).send('Id unknown : ' + req.params.id);
  try {
    //add to the follower list(ajouter à la liste des abonnés)=>suivre
    await UserModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { following: req.body.idToFollow } },
      { new: true, upsert: true },
      (err, docs) => {
        if (!err) res.status(201).json(docs);
        else return res.status(400).json(err);
      }
    );
    // add to following list(pour la personne qui est suivi)=>suivi
    await UserModel.findByIdAndUpdate(
      req.body.idToFollow,
      { $addToSet: { followers: req.params.id } },
      { new: true, upsert: true },
      (err, docs) => {
        if (err) return res.status(400).json(err);
      }
    )
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

//desabonner d'un user
module.exports.unfollowUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id) || !ObjectID.isValid(req.body.idToUnFollow))
    return res.status(400).send('Id unknown : ' + req.params.id);
  try {
    //add to the follower list
    await UserModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { following: req.body.idToUnFollow } },
      { new: true, upsert: true },
      (err, docs) => {
        if (!err) res.status(201).json(docs);
        else return res.status(400).json(err);
      }
    );
    // add to following list(pour la personne qui est suivi)
    await UserModel.findByIdAndUpdate(
      req.body.idToUnFollow,
      { $pull: { followers: req.params.id } },
      { new: true, upsert: true },
      (err, docs) => {
        if (err) return res.status(400).json(err);
      }
    )
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};
