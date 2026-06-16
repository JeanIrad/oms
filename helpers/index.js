exports.onlyAdmin = async function (req) {
  if (!req.user?.is('admin')) return req.reject(403);
};
