import { Request, Response, RequestHandler, NextFunction } from "express";

/*
  - `RequestHandler` is the correct type for an Express middleware/route function.
  - The trycatch utility takes such a handler and wraps it in an async function.
  - If the handler throws, it passes the error to `next`, for Express error handling.
  - The types are used correctly.
  - The function exports as default.
  - No syntax or logic errors are present.
  - Style: A slight style improvement would be to consistently format the import statement with spaces after commas.
*/

function TryCatch(handler: RequestHandler): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export default TryCatch;