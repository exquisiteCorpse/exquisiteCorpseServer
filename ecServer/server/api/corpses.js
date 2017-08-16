'use strict'
/**
 * Corpse API
 * Corpse Model: title, totalCells, complete
 */
const router = require('express').Router()
const {Corpse, Photo, User, Assignment, Like} = require('../db/models')
module.exports = router
const Sequelize = require('sequelize')
const fs = require('fs')
const publicCorpseDir = 'public/corpse'
const {mergePhotos} = require('../util/util')

/**
 * Default columns
 */
const attributesToReturn = {attributes: ['id', 'title', 'totalCells', 'complete']}

function isLoggedIn(req, res, next) {
  if (req.user) {
    next()
  } else {
    const error = new Error('Not allowed!!')
    error.status = 401
    next(error)
  }
}

function isAdmin(req, res, next) {
  if (req.user.isAdmin) {
    next()
  } else {
    const error = new Error('Must have admin privileges')
    error.status = 401
    next(error)
  }
}

/**
 * CorpseID Param
 * returns
 */
router.param('corpseId', (req, res, next, id) => {
  Corpse.findById(id,
    {
      include: [
        {model: Photo},
        {model: Assignment},
        {model: User, attributes: ['id', 'username', 'email']},
        {model: Like, attributes: ['id', 'userId']}
      ]
    })
    .then(corpse => {
      if (!corpse) {
        const err = Error('Corpse not found')
        err.status = 400
        throw err
      }
      req.corpse = corpse
      next()
      return null
    })
    .catch(next)
})

/**
 * route /api/corpse
 * GET
 * returns all corpse
 */
router.get('/', (req, res, next) => {
  Corpse.findAll(attributesToReturn)
    .then(corpse => res.json(corpse))
    .catch(next)
})

/**
 * route /api/corpse/corpseId i.e. /api/corpse/1
 * GET
 * returns a specific corpse by corpseId
 */
router.get('/:corpseId', (req, res, next) => {
  res.json(req.corpse)
})

/**
 * route /api/corpse
 * POST
 * creates and returns new Corpse
 */
router.post('/', (req, res, next) => {
  Corpse.create(req.body)
    .then(corpse => {
      const corpseDir = `${publicCorpseDir}/${corpse.id}`
      if (!fs.existsSync(publicCorpseDir)) fs.mkdirSync(publicCorpseDir)
      fs.mkdirSync(corpseDir)
      res.status(201).json(corpse)
    })
    .catch(next)
})

/**
 * route /api/corpse/corpseId
 * PUT
 * updates and existing corpse by its corpseId
 */
router.put('/:corpseId', (req, res, next) => {
  const {append} = req.body || '-append'
  const corpseDir = `${publicCorpseDir}/${req.corpse.id}`
  req.corpse.update(req.body)
    .then(corpse => {
      if (corpse.complete) mergePhotos(req.corpse.id, corpseDir, append)
      res.status(201).json(corpse)
    })
    .catch(next)
})

/**
 * route /api/corpse/corpseId
 * DEL
 * deletes an existing corpse by its corpseId
 */
router.delete('/:corpseId', (req, res, next) => {
  const dirPath = `${publicCorpseDir}/${req.corpse.id}`
  if (fs.existsSync(dirPath)) {
    fs.rmdirSync(dirPath)
  }
  req.corpse.destroy()
    .then(() => res.status(204).end())
    .catch(next)
})
