import sqlite3 from 'sqlite3';

export default class Database {
  constructor({ dbPath }) {
    this.db = new sqlite3.Database(dbPath);
  }

  get(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, ...params, (err, result) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });
    });
  }

  all(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, ...params, (err, result) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(result);
        }
      });
    });
  }

  insert(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, ...params, function(err) {
        if (err) {
          reject(err);
        }
        else {
          resolve(this.lastID);
        }
      });
    });
  }

  run(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, ...params, err => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, err => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    });
  }

  initialize({ schema }) {
    let result = {};

    return this.exec(schema)
      .then(() => this.all('select id, name, type, config from data_sources order by createdAt desc'))
      .then(dataSources => {
        result.dataSources = dataSources;
        return this.all('select id, title from queries order by createdAt desc');
      })
      .then(queries => {
        result.queries = queries;
        return result;
      });
  }

  createDataSource(params) {
    let sql = `
      insert into data_sources
      (name, type, config, createdAt, updatedAt)
      values (?, ?, ?, datetime('now'), datetime('now'))
    `;
    let { name, type } = params;
    let config = JSON.stringify(params.config);

    return this.insert(sql, name, type, config).then(id => {
      return { id, name, type, config };
    });
  }

  updateDataSource(params) {
    let sql = `
      update data_sources
      set name = ?, type = ?, config = ?, updatedAt = datetime('now')
      where id = ?
    `;
    let { id, name, type } = params;
    let config = JSON.stringify(params.config);

    return this.run(sql, name, type, config, id);
  }

  deleteDataSource(id) {
    let sql = 'delete from data_sources where id = ?';

    return this.run(sql, id);
  }

  getQuery(id) {
    return this.get('select * from queries where id = ?', id);
  }

  createQuery(params) {
    let sql = `
      insert into queries
      (dataSourceId, title, updatedAt, createdAt)
      values (?, ?, datetime('now'), datetime('now'))
    `;
    let { dataSourceId, title } = params;

    return this.insert(sql, dataSourceId, title).then(id => {
      return { id, dataSourceId, title };
    });
  }

  updateQuery(params) {
    let fields = [];
    let values = [];

    Object.keys(params).forEach(field => {
      if (field === 'id') return;
      fields.push(field);
      values.push(params[field]);
    });
    values.push(params.id);

    let sql = `
      update queries
      set ${fields.map(f => `${f} = ?`).join(', ')}, updatedAt = datetime('now')
      where id = ?
    `;

    return this.run(sql, values);
  }
}
