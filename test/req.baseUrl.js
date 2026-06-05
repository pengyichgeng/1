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

    it('should contain full lower path for 4-level nested routers', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()
      var sub4 = express.Router()

      sub4.get('/:e', function(req, res){
        res.end(req.baseUrl)
      })
      sub3.use('/:d', sub4)
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/foo/bar/baz/zed/qux')
      .expect(200, '/foo/bar/baz/zed', done);
    })

    it('should contain full lower path for 5-level nested routers', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()
      var sub4 = express.Router()
      var sub5 = express.Router()

      sub5.get('/:f', function(req, res){
        res.end(req.baseUrl)
      })
      sub4.use('/:e', sub5)
      sub3.use('/:d', sub4)
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/a/b/c/d/e/f')
      .expect(200, '/a/b/c/d/e', done);
    })

    it('should preserve req.originalUrl in 4-level nested routers', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()
      var sub4 = express.Router()

      sub4.get('/:e', function(req, res){
        var remaining = req.originalUrl.slice(req.baseUrl.length)
        res.end(req.baseUrl + ':' + req.originalUrl + ':' + remaining)
      })
      sub3.use('/:d', sub4)
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/foo/bar/baz/zed/qux')
      .expect(200, '/foo/bar/baz/zed:/foo/bar/baz/zed/qux:/qux', done);
    })

    it('should preserve req.route metadata in nested routers', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()
      var sub4 = express.Router()
      var sub5 = express.Router()

      sub5.get('/:f', function(req, res){
        res.end(JSON.stringify({
          baseUrl: req.baseUrl,
          hasRoute: !!req.route,
          routePath: req.route ? req.route.path : null
        }))
      })
      sub4.use('/:e', sub5)
      sub3.use('/:d', sub4)
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/a/b/c/d/e/f')
      .expect(200, JSON.stringify({
        baseUrl: '/a/b/c/d/e',
        hasRoute: true,
        routePath: '/:f'
      }), done);
    })

    it('should correctly strip base path from req.originalUrl in 6-level nested routers', function(done){
      var app = express()
      var sub1 = express.Router()
      var sub2 = express.Router()
      var sub3 = express.Router()
      var sub4 = express.Router()
      var sub5 = express.Router()
      var sub6 = express.Router()

      sub6.get('/:g', function(req, res){
        var remaining = req.originalUrl.slice(req.baseUrl.length)
        res.end(remaining)
      })
      sub5.use('/:f', sub6)
      sub4.use('/:e', sub5)
      sub3.use('/:d', sub4)
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/a/b/c/d/e/f/g')
      .expect(200, '/g', done);
    })
  })
})
