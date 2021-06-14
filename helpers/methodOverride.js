//Simplifies a little the logic to override the method of a form

exports.methodInBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}

