"use strict"

const DatabaseAbstractor = require('database-abstractor');

const coursedb = new DatabaseAbstractor();

const db = {
  host: null,
  port: null
}

const emb01 = {
  courseId: 'emb-01',
  title: 'Beginning Embedded C Programming',
  snippet: 'A course design for beginner',
  level: 'Beginner',
  thumbnail: 'https://avatars1.githubusercontent.com/u/17599993?s=88&v=4',
  picture: {
    type: 'yt',
    uri: 'https://www.youtube.com/embed/tpIctyqH29Q'
  },
  skills: ['C Programming', 'Embedded ARM processor'],
  certificates: ['Embedded C Programmer'],
  objective: [
    'Lorem ipsum dolor sit amet, impetus menandri temporibus an nam, duo no elit euripidis democritum',
    'Illum exerci has ne. Virtute definitionem ut vim, eam malis dictas option ex. Eu persius torquatos vim, usu atqui movet alienum ne, te eam aperiri hendrerit appellantur. Sit brute lorem blandit at. Has an graece sensibus. Sint movet voluptatum nam et',
    'Lorem ipsum dolor sit amet, impetus menandri temporibus an nam, duo no elit euripidis democritum',
    'Illum exerci has ne. Virtute definitionem ut vim, eam malis dictas option ex. Eu persius torquatos vim, usu atqui movet alienum ne, te eam aperiri hendrerit appellantur. Sit brute lorem blandit at. Has an graece sensibus. Sint movet voluptatum nam et'
  ],
  description: 'Lorem ipsum dolor sit amet, impetus menandri temporibus an nam, duo no elit euripidis democritum. Illum exerci has ne. Virtute definitionem ut vim, eam malis dictas option ex. Eu persius torquatos vim, usu atqui movet alienum ne, te eam aperiri hendrerit appellantur. Sit brute lorem blandit at. Has an graece sensibus. Sint movet voluptatum nam et.',
  structure: {
    video: 62,
    quiz: 16,
    exercise: 2,
    test: 1
  },
  price: {
    value: 499000,
    currency: 'VND',
    locale: 'it-IT'
  },
  enroll: 2018
}


module.exports = {

  _dbready: false,

  _tables: null,

  _users: {},

  queue: [],

  use({host, port}) {
    db.host = host;
    db.port = port;

    coursedb.use(require('coursedb-dynamodb-driver')(
      {
        region : 'us-west-2', 
        endpoint : `${db.host}:${db.port}`
      },
      (err, data) => {
        if (err) {
          console.log('Failed to init local db')
          throw new Error(err)
        } else {
          this._dbready = true;
          this._tables = data.TableNames;
          if (this.queue.length > 0) {
            this.queue.forEach(fn => this[fn.name].apply(this,fn.args))
          }
        }
      }
    ))

    return this;
  },

  init(done) {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    if (this._tables) {
      if (this._tables.indexOf('COURSES') === -1) {
        console.log('\nInitializing COURSES Table...')
        return this.new(() => {
          console.log('COURSES Table is created and ready to use.');
          done && done();
        });
      } else {
        console.log('COURSES Table already exists');
        done && done();
        return this;
      }
    } else {
      this.queue.push({name: 'init', args: [done]})
    }
  },

  new(done) {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    if (this._dbready) {
      coursedb.createTable((err, data) => {
        if (err) {
          console.log('Failed to create COURSES table')
          console.log(err);
        } else {  
          this._createNewEntries(done);
        }
      })
    } else {
      this.queue.push({name: 'new', args: [done]})
    }
    return this;
  },

  reset () {
    if (!db.host && !db.port) {
      throw new Error('host and port of database must be define.')
    }
    const self = this;
    if (this._dbready) {
      coursedb.dropTable(function(err, data) {
        if (err) {
          console.log('Failed to drop ENROLL table')
          console.log(err);
        } else {
          console.log('Dropped old COURSES table')
          coursedb.createTable((err, data) => {
            if (err) {
              console.log('Failed to create COURSES table')
              console.log(err);
            } else {  
              self._createNewEntries();
            }
          })
        }
      })
    } else {
      this.queue.push({name: 'reset', args: [done]})
    }
    return this;
  },

  _createNewEntry(uid, course) {
    return new Promise((resolve, reject) => {
      coursedb.createCourses({ uid, course }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data)
        }
      })
    })
  },

  _createNewEntries(done) {
    console.log('Creating new course...')  
    Promise.all([
      this._createNewEntry('tester@team.com', emb01), 
    ]).then(values => {
      console.log('Created all courses.')
      done && done();
    }).catch(function(err) {
      console.log(err);
      done && done(err)
    });
    return this;
  }

}

