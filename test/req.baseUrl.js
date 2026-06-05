'use strict'

var express = require('..')
var request = require('supertest')

describe('req', function(){
  describe('.baseUrl', function(){
    it('should be empty for top-level route', function(done){
      var app = express()

      app.get('/:a', function(req, res){
        res.end(req.baseUrl)
      })

      request(app)
      .get('/foo')
      .expect(200, '', done)
    })

    it('should contain lower path', function(done){
      var app = express()
      var sub = express.Router()

      sub.get('/:b', function(req, res){
        res.end(req.baseUrl)
      })
      app.use('/:a', sub)

      request(app)
      .get('/foo/bar')
      .expect(200, '/foo', done);
    })

    it('should contain full lower path', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()

      sub3.get('/:d', function(req, res){
        res.end(req.baseUrl)
      })
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '/foo/bar/baz', done);
    })

    it('should travel through routers correctly', function(done){
      var urls = []
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()

      sub3.get('/:d', function(req, res, next){
        urls.push('0@' + req.baseUrl)
        next()
      })
      sub2.use('/:c', sub3)
      sub1.use('/', function(req, res, next){
        urls.push('1@' + req.baseUrl)
        next()
      })
      sub1.use('/bar', sub2)
      sub1.use('/bar', function(req, res, next){
        urls.push('2@' + req.baseUrl)
        next()
      })
      app.use(function(req, res, next){
        urls.push('3@' + req.baseUrl)
        next()
      })
      app.use('/:a', sub1)
      app.use(function(req, res, next){
        urls.push('4@' + req.baseUrl)
        res.end(urls.join(','))
      })

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '3@,1@/foo,0@/foo/bar/baz,2@/foo/bar,4@', done);
    })

    it('should work with 5 levels of nested routers', function(done) {
      var app = express()
      var level1 = express.Router()
      var level2 = express.Router()
      var level3 = express.Router()
      var level4 = express.Router()
      var level5 = express.Router()

      level5.get('/test', function(req, res) {
        res.json({
          baseUrl: req.baseUrl,
          originalUrl: req.originalUrl,
          url: req.url,
          path: req.path
        })
      })

      level4.use('/level4', level5)
      level3.use('/level3', level4)
      level2.use('/level2', level3)
      level1.use('/level1', level2)
      app.use('/api', level1)

      request(app)
        .get('/api/level1/level2/level3/level4/test')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err)
          
          // 验证结果
          if (res.body.baseUrl !== '/api/level1/level2/level3/level4') {
            return done(new Error('Expected baseUrl /api/level1/level2/level3/level4, got ' + res.body.baseUrl))
          }
          if (res.body.originalUrl !== '/api/level1/level2/level3/level4/test') {
            return done(new Error('Expected originalUrl /api/level1/level2/level3/level4/test, got ' + res.body.originalUrl))
          }
          if (res.body.url !== '/test') {
            return done(new Error('Expected url /test, got ' + res.body.url))
          }
          done()
        })
    })

    it('should preserve req.originalUrl through all nested levels', function(done) {
      var app = express()
      var level1 = express.Router()
      var level2 = express.Router()
      var level3 = express.Router()
      var level4 = express.Router()
      var level5 = express.Router()
      var level6 = express.Router()
      var originalUrls = []

      function captureOriginalUrl(label) {
        return function(req, res, next) {
          originalUrls.push(label + ':' + req.originalUrl)
          next()
        }
      }

      level6.get('/end', captureOriginalUrl('L6'), function(req, res) {
        // 检查所有层级都正确保留了 originalUrl
        res.json({
          originalUrls: originalUrls,
          finalBaseUrl: req.baseUrl,
          finalOriginalUrl: req.originalUrl
        })
      })

      level5.use('/level5', captureOriginalUrl('L5'), level6)
      level4.use('/level4', captureOriginalUrl('L4'), level5)
      level3.use('/level3', captureOriginalUrl('L3'), level4)
      level2.use('/level2', captureOriginalUrl('L2'), level3)
      level1.use('/level1', captureOriginalUrl('L1'), level2)
      app.use('/app', captureOriginalUrl('APP'), level1)

      request(app)
        .get('/app/level1/level2/level3/level4/level5/end')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err)
          
          const expectedUrl = '/app/level1/level2/level3/level4/level5/end'
          
          // 验证所有层级的 originalUrl 都是相同的原始 URL
          for (const entry of res.body.originalUrls) {
            const url = entry.split(':')[1]
            if (url !== expectedUrl) {
              return done(new Error(`Expected ${expectedUrl} at all levels, got ${url}`))
            }
          }
          
          done()
        })
    })
  })
})
