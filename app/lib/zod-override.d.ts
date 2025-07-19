/**
 * Type overrides for Zod to make v4 compatible with v3 code
 */

import 'zod';

declare module 'zod' {
  interface ZodTypeDef {}

  interface ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
    // Add any missing methods here
  }

  // Override the union function to accept both v3 and v4 signatures
  export function union<
    T extends readonly [ZodTypeAny, ...ZodTypeAny[]]
  >(types: T): ZodUnion<T>;
  export function union<
    T extends readonly [ZodTypeAny, ...ZodTypeAny[]]
  >(types: T, params: any): ZodUnion<T>;

  // Override the discriminatedUnion function to accept both v3 and v4 signatures
  export function discriminatedUnion<
    Discriminator extends string,
    Types extends readonly [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]]
  >(discriminator: Discriminator, types: Types): ZodDiscriminatedUnion<Discriminator, Types>;
  export function discriminatedUnion<
    Discriminator extends string,
    Types extends readonly [ZodDiscriminatedUnionOption<Discriminator>, ...ZodDiscriminatedUnionOption<Discriminator>[]]
  >(discriminator: Discriminator, types: Types, params: any): ZodDiscriminatedUnion<Discriminator, Types>;
}
