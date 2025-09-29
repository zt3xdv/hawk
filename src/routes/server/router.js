class Router {
  constructor() {
    this.routes = [];
  }

  _add(method, path, ...handlers) {
    this.routes.push({ method, path, handlers });
    return this;
  }

  get(path, ...handlers) {
    return this._add('get', path, ...handlers);
  }

  post(path, ...handlers) {
    return this._add('post', path, ...handlers);
  }

  put(path, ...handlers) {
    return this._add('put', path, ...handlers);
  }

  delete(path, ...handlers) {
    return this._add('delete', path, ...handlers);
  }
  
  async parse(req, res) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString();
      try {
        req.body = raw ? JSON.parse(raw) : {};
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid data.' }));
        return null;
      }
    }
    return true;
  };

  setApp(app) {
    for (const { method, path, handlers } of this.routes) {
      app[method](path, ...handlers);
    }
  }
}

export default Router;
