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
    FieldTitle
} from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea
} from "@/components/ui/input-group";
import { AtSignIcon, EyeIcon, LockKeyholeIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { signin } from "@/lib/actions/auth";
// import Link from "next/link";
import { Link } from "next-view-transitions";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

export default function Signin() {
    const [state, action, pending] = useActionState(signin, undefined);
    return (
        <Card className="w-full max-w-xs">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                    Enter your email and password below to sign in.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="signin" action={action}>
                    <FieldGroup>
                        <div className="flex flex-col gap-0 rounded-lg overflow-hidden">
                            <Field data-disabled={pending}>
                                <InputGroup className="h-12 gap-1.5 ring-0! border-0! rounded-none!">
                                    <InputGroupInput
                                        name="username"
                                        placeholder="Username"
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
                                        placeholder="Password"
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
                    <Button type="submit" form="signin" disabled={pending}>
                        Sign in
                    </Button>
                    <FieldDescription className="text-center">
                        Need an account? <Link href="/signup">Sign up</Link>
                    </FieldDescription>
                </Field>
            </CardFooter>
        </Card>
    );
}
