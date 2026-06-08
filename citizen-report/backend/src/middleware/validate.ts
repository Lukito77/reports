/**
 * Request validation. Wraps a Zod schema and validates body/query/params,
 * replacing them with the parsed (and coerced) values so handlers get typed,
 * trusted input. Rejects everything else.
 */
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

export function validate(schema: { body?: Schema; query?: Schema; params?: Schema }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query) as Request['query'];
      if (schema.params) req.params = schema.params.parse(req.params) as Request['params'];
      next();
    } catch (err) {
      next(err);
    }
  };
}
