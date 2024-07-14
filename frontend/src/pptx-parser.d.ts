declare module 'pptx-parser' {
    export default class PptxParser {
      parse(arrayBuffer: ArrayBuffer): Promise<any>;
    }
  }