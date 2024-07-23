import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export default async function getFileText(file: File): Promise<string> {
    if (file.name.endsWith('.pdf')) {
        return await getPDFText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return await getExcelText(file);
    } else if (file.name.endsWith('.csv')) {
        return await getCSVText(file);
    } else if (file.name.endsWith('.docx')) {
        return await getDocxText(file);
    } else if (file.name.endsWith('.pptx')) {
        return await getPptxText(file);
    } else {
        throw new Error('Unsupported file type');
    }
}

async function getPDFText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText.trim();
}

async function getExcelText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let fullText = '';
    workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const sheetText = data.map((row) => row.join(', ')).join('\n');
        fullText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
    });

    return fullText.trim();
}

async function getCSVText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                const text = results.data.map((row) => row.join(', ')).join('\n');
                resolve(text);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

async function getDocxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function getPptxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    let content = '';
    let slideIndex = 1;

    for (const fileName in zipContent.files) {
        if (fileName.startsWith('ppt/slides/slide')) {
            const slide = await zipContent.file(fileName)?.async('string');
            if (slide) {
                content += `Slide ${slideIndex}:\n`;
                const textMatches = slide.match(/<a:t>(.+?)<\/a:t>/g);
                if (textMatches) {
                    textMatches.forEach((match) => {
                        const text = match.replace(/<a:t>|<\/a:t>/g, '');
                        content += `${text}\n`;
                    });
                }
                content += '\n';
                slideIndex++;
            }
        }
    }
    return content;
}