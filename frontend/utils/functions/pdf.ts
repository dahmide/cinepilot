/*
import * as pdfjsLib from "pdfjs-dist";

export async function getPdfPageCount(file: File): Promise<number> {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    return pdf.numPages;
}
*/

import { PDFDocument } from "pdf-lib";

export async function getPdfPageCount(file: File): Promise<number> {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer);
    return pdf.getPageCount();
}
