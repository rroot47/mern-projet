const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const uploadController = require('../controllers/upload.controller');
const multer = require('multer');
const upload = multer();

//auth
router.post('/register', authController.signUp);
router.post('/login', authController.signIn);
router.get('/logout', authController.logout);

//user display: 'block
router.get('/allUsers', userController.getAllUsers);
router.get('/:id', userController.getUsersInfo);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/follow/:id', userController.followUser);
router.patch('/unfollow/:id', userController.unfollowUser);

//upload
router.post('/upload', upload.single('file'), uploadController.uploadProfil);

module.exports = router;