const { Request, Response } = require('express')

const test = async (req: Request, res: Response) => {
  return res.json()
}
module.exports = { test }
