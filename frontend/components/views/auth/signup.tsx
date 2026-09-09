"use client";

import { useActionState } from "react";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { AtSignIcon, EyeIcon, LockKeyholeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signup } from "@/lib/actions/auth";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function Signup() {
    const [state, action, pending] = useActionState(signup, undefined);
    return (
        <Card className="w-full max-w-xs md:max-w-sm">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                    Enter your email and password below to sign up.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="signup" action={action} autoComplete="off">
                    <FieldGroup>
                        <div className="flex flex-col gap-0 border border-muted rounded-lg overflow-hidden">
                            <Field data-disabled={pending}>
                                <InputGroup className="h-12 gap-1.5 ring-0! border-0! rounded-none!">
                                    <InputGroupInput
                                        name="username"
                                        placeholder="John"
                                        disabled={pending}
                                    />
                                    <InputGroupAddon className="pl-3!">
                                        <AtSignIcon />
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                            <Separator />
                            <Field data-disabled={pending}>
                                <InputGroup className="h-12 gap-1.5 ring-0! border-0! rounded-none!">
                                    <InputGroupInput
                                        name="password"
                                        placeholder="1234"
                                        disabled={pending}
                                    />
                                    <InputGroupAddon className="pl-3!">
                                        <LockKeyholeIcon />
                                    </InputGroupAddon>
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupButton size="icon-sm">
                                            <EyeIcon />
                                        </InputGroupButton>
                                    </InputGroupAddon>
                                </InputGroup>
                            </Field>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
            <CardFooter>
                <Field orientation="vertical">
                    <Button type="submit" form="signup" disabled={pending}>
                        {pending ? <Spinner /> : "Sign up"}
                    </Button>
                    <FieldDescription className="text-center">
                        Have an account? <Link href="/signin">Sign In</Link>
                    </FieldDescription>
                </Field>
            </CardFooter>
        </Card>
    );
}
