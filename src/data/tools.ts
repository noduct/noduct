import type { ToolDefinition } from '@/types/tool';

const planned = (
  category: ToolDefinition['category'],
  names: Array<[string, string, string[]]>
): ToolDefinition[] =>
  names.map(([name, description, keywords]) => ({
    id: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, ''),
    name,
    slug: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, ''),
    description,
    category,
    keywords,
    icon: 'Wand2',
    status: 'planned',
    featured: false
  }));

export const tools: ToolDefinition[] = [
  ...planned('pdf-tools', [
    ['Merge PDF', 'Combine multiple PDF files into one document.', ['join', 'combine', 'pdf']],
    ['Split PDF', 'Separate a PDF into individual files.', ['extract', 'pages', 'pdf']],
    ['Compress PDF', 'Reduce PDF file size while preserving readability.', ['optimize', 'size']],
    ['PDF to JPG', 'Convert PDF pages into JPG images.', ['convert', 'image']],
    ['JPG to PDF', 'Combine JPG images into a PDF document.', ['convert', 'image']],
    ['Rotate PDF', 'Rotate selected pages in a PDF document.', ['pages', 'orientation']],
    ['Extract PDF Pages', 'Save selected pages as a new PDF.', ['extract', 'pages']],
    ['Reorder PDF Pages', 'Arrange PDF pages into a new order.', ['organize', 'pages']]
  ]),
  ...planned('image-tools', [
    ['Compress Image', 'Reduce image file size for faster sharing.', ['optimize', 'photo']],
    ['Resize Image', 'Change image dimensions precisely.', ['dimensions', 'scale']],
    ['Crop Image', 'Trim an image to the area you need.', ['trim', 'photo']],
    ['PNG to JPG', 'Convert PNG images into JPG format.', ['convert', 'image']],
    ['JPG to PNG', 'Convert JPG images into PNG format.', ['convert', 'image']],
    ['Image to WebP', 'Convert common image formats into WebP.', ['convert', 'webp']],
    ['WebP to PNG', 'Convert WebP images into PNG format.', ['convert', 'png']]
  ]),
  ...planned('text-tools', [
    ['Word Counter', 'Count words, characters and lines in text.', ['count', 'writing']],
    ['Character Counter', 'Count characters with or without spaces.', ['count', 'text']],
    ['Case Converter', 'Transform text between common letter cases.', ['uppercase', 'lowercase']],
    ['Text Diff Checker', 'Compare two texts and highlight differences.', ['compare', 'difference']],
    ['Remove Duplicate Lines', 'Remove repeated lines from text.', ['deduplicate', 'clean']],
    ['Remove Extra Spaces', 'Normalize repeated spaces and blank lines.', ['clean', 'whitespace']]
  ]),
  ...planned('data-tools', [
    ['CSV Viewer', 'Inspect CSV data in a readable table.', ['spreadsheet', 'table']],
    ['CSV to JSON', 'Convert CSV records into JSON.', ['convert', 'data']],
    ['JSON to CSV', 'Convert JSON arrays into CSV.', ['convert', 'data']],
    ['JSON Formatter', 'Format and inspect JSON data.', ['pretty print', 'indent']],
    ['JSON Validator', 'Check JSON syntax and identify errors.', ['validate', 'syntax']],
    ['XML to JSON', 'Convert XML documents into JSON.', ['convert', 'data']],
    ['YAML to JSON', 'Convert YAML documents into JSON.', ['convert', 'data']]
  ]),
  ...planned('developer-tools', [
    ['Base64 Encoder', 'Encode and decode Base64 text.', ['decode', 'encode']],
    ['URL Encoder', 'Encode and decode URL components.', ['percent', 'decode']],
    ['JWT Decoder', 'Inspect JWT header and payload data.', ['token', 'decode']],
    ['UUID Generator', 'Generate random UUID values.', ['guid', 'random']],
    ['Regex Tester', 'Test regular expressions against text.', ['pattern', 'match']],
    ['Hash Generator', 'Generate cryptographic hashes locally.', ['checksum', 'digest']],
    ['Unix Timestamp Converter', 'Convert Unix timestamps and dates.', ['epoch', 'date']],
    ['Cron Expression Parser', 'Explain and preview cron schedules.', ['schedule', 'time']]
  ]),
  ...planned('general-utilities', [
    ['QR Code Generator', 'Create a QR code from text or a URL.', ['barcode', 'link']],
    ['Password Generator', 'Generate strong passwords locally.', ['security', 'random']],
    ['Unit Converter', 'Convert common measurement units.', ['measurement', 'calculate']],
    ['Percentage Calculator', 'Calculate percentages and changes.', ['math', 'calculate']],
    ['Date Calculator', 'Calculate durations and date differences.', ['time', 'duration']],
    ['Color Converter', 'Convert color values between formats.', ['hex', 'rgb', 'hsl']]
  ])
];

export const publishedTools = tools.filter((tool) => tool.status === 'published');
export const featuredTools = publishedTools.filter((tool) => tool.featured);
export const toolsByCategory = (category: ToolDefinition['category'], includePlanned = false) =>
  tools.filter((tool) => tool.category === category && (includePlanned || tool.status !== 'planned'));
