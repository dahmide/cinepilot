"use client";

import { useState, useEffect } from "react";
import { Container, Section } from "@/components/layout";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { UploadInfo } from "@/components/blocks/upload/upload-info";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { getPdfPageCount } from "@/utils/functions/pdf";
import { uploadScreenplay } from "@/lib/dal/upload.dal";
import Link from "next/link";
// import { Link } from "next-view-transitions";

type UploadSpecs = { name: string; size: string; type: "PDF" } | null;
type UploadState = React.ComponentProps<typeof UploadInfo>["type"];

const formatBytes = bytes => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const j = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return j + " " + sizes[i];
};

export default function Upload() {
    const [isDisabled, setIsDisabled] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<UploadSpecs>(null);
    const [uploadState, setUploadState] = useState<UploadState>({
        status: "idle"
    });

    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
        disabled: isDisabled,
        accept: { "application/pdf": [".pdf"] }
    });

    const handleUpload = async (file: File) => {
        const pageCount = await getPdfPageCount(file);
        await uploadScreenplay(file, pageCount, {
            onStage: e => {
                setUploadState({
                    stage: e.message,
                    status: "staging"
                });
            },
            onError: e => {
                setUploadState({
                    error: e.message,
                    status: "idle"
                });
            },
            onComplete: e => {
                setUploadState({
                    route: e.projectId,
                    status: "done"
                });
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const file = data.get("screenplay") as File;

        setIsDisabled(true);
        await handleUpload(file);
    };

    useEffect(() => {
        const file = acceptedFiles[0];
        if (!file) return;
        setUploadFiles({
            name: file.name,
            size: formatBytes(file.size),
            type: "PDF"
        });
        setUploadState({
            status: "pending"
        });
    }, [acceptedFiles]);

    return (
        <Section>
            <Container className="flex flex-col gap-3">
                <Eyebrow>New Project</Eyebrow>
                <h1>Upload Screenplay</h1>
                <p>
                    Drop a PDF to extract, analyse, and organize into a project
                    automatically.
                </p>
                <Card className="w-full max-w-xl mt-4 mx-auto">
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <FieldGroup className="h-96 flex flex-col gap-8">
                                <Field
                                    className="group/dropzone p-4 flex-1 flex flex-col items-center justify-center border-3 border-dotted border-muted-foreground rounded-lg"
                                    {...getRootProps()}
                                >
                                    <Input
                                        {...getInputProps()}
                                        name="screenplay"
                                    />
                                    <UploadInfo
                                        type={uploadState}
                                        file={uploadFiles}
                                    />
                                </Field>
                                <div className="shrink-0">
                                    {uploadState.status === "staging" ? (
                                        <Field>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                disabled={true}
                                            >
                                                Cancel
                                            </Button>
                                        </Field>
                                    ) : uploadState.status === "done" ? (
                                        <Field>
                                            <Button
                                                variant="default"
                                                type="button"
                                                nativeButton={false}
                                                render={
                                                    <Link
                                                        href={`${uploadState.route}`}
                                                    >
                                                        Open project
                                                    </Link>
                                                }
                                            />
                                        </Field>
                                    ) : (
                                        <Field>
                                            <Button
                                                variant="outline"
                                                type="submit"
                                            >
                                                Upload
                                            </Button>
                                            <Button
                                                variant="link"
                                                type="button"
                                                nativeButton={false}
                                                render={
                                                    <a
                                                        href="files/sample-pdf.pdf"
                                                        download
                                                    >
                                                        Download sample PDF
                                                    </a>
                                                }
                                            />
                                        </Field>
                                    )}
                                </div>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
                <FieldDescription className="text-center">
                    <span>PDF files only</span>
                    <span className="mx-1">&bull;</span>
                    <span>Max 10MB</span>
                </FieldDescription>
            </Container>
        </Section>
    );
}
