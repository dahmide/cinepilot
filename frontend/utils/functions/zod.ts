import * as z from "zod";

type SafeParsePass<T> = { success: true; data: T };
type SafeParseFail = {
    success: false;
    errors: ReturnType<typeof z.flattenError>;
};

export function zodParse<S extends z.ZodTypeAny>(
    schema: S,
    data: unknown
): SafeParsePass<z.output<S>> | SafeParseFail {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    } else {
        const errors = z.flattenError(result.error);
        return { success: false, errors: errors.fieldErrors };
    }
}
