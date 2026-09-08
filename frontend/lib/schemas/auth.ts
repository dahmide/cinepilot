import * as z from "zod";

export const AuthSchema = z.object({
    username: z
        .string()
        .min(2, { error: "Username must be at least 2 characters long." })
        .trim(),
    password: z
        .string()
        .min(4, { error: "Password must be at least 8 characters long." })
        /*
        .regex(/[a-z]/, { error: "Password must contain at least one letter." })
        .regex(/[A-Z]/, { error: "Password must contain at least one letter." })
        */
        .regex(/[0-9]/, { error: "Password must contain at least one number." })
        /*.regex(/[^a-zA-Z0-9]/, {
            error: "Password must contain at least one special character."
        })
        */
        .trim()
});

export type AuthFormState =
    | {
          errors?: Partial<Record<keyof AuthInput, string[]>>;
          message?: string;
          success: boolean;
      }
    | undefined;

export type AuthFormInput = z.infer<typeof AuthSchema>;
