
const getPackagesRoot = function(pages){
  let res = {}
  const { config:appConfig = {} } = pages.app || {},
    _subPackages = appConfig.subPackages || appConfig.subpackages || []

  _subPackages.map(sp => {
    const { pages = [], root } = sp
    pages.map(p=>res[`${root}/${p}`]=root)
  })

  return res
}

module.exports = {
  getPackagesRoot
}