// src/routes/v1/room.route.js
const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roomValidation = require('../../validations/room.validation');
const roomController = require('../../controllers/room.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(roomValidation.createRoom), roomController.createRoom)
  .get(auth('admin', 'user'), validate(roomValidation.getRooms), roomController.getRooms);

router
  .route('/:roomId')
  .get(auth('admin', 'user'), validate(roomValidation.getRoom), roomController.getRoom)
  .patch(auth('admin'), validate(roomValidation.updateRoom), roomController.updateRoom)
  .delete(auth('admin'), validate(roomValidation.deleteRoom), roomController.deleteRoom);

module.exports = router;