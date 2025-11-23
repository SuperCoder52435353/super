/**
 * AI Pro Converter - Ultimate Brain Module
 * Version 2.0 - Advanced File Processing with Chunking
 */

const Brain = {
    currentFile: null,
    fileData: null,
    fileType: '',
    fileName: '',
    userStats: { files: 0, converts: 0, messages: 0 },
    maxChunkSize: 5 * 1024 * 1024, // 5MB chunks for large files

    init() {
        this.setupFileInput();
        this.setupDragDrop();
    },

    setupFileInput() {
        const fileInput = $('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processFile(file);
        });
    },

    setupDragDrop() {
        const uploadBox = document.querySelector('.upload-box');
        if (!uploadBox) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        uploadBox.addEventListener('dragenter', () => {
            uploadBox.classList.add('drag-over');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
        });

        uploadBox.addEventListener('drop', (e) => {
            uploadBox.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    },

    async processFile(file) {
        // Validate file size with warnings
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (file.size > 50 * 1024 * 1024) {
            Utils.notify('⚠️ Fayl juda katta! Maksimal 50MB ruxsat etilgan.', 'error');
            AI.addMessage('ai', `
                <div style="line-height: 1.8;">
                    <h3 style="color: #f5576c; margin-bottom: 15px;">⚠️ Fayl Juda Katta!</h3>
                    <p>Siz yuklagan fayl hajmi: <strong>${fileSizeMB.toFixed(2)} MB</strong></p>
                    <p style="margin-top: 15px;">📏 <strong>Maksimal ruxsat etilgan:</strong> 50 MB</p>
                    
                    <div style="background: rgba(255, 210, 0, 0.1); padding: 15px; border-radius: 10px; margin-top: 20px;">
                        <h4 style="color: #ffd200; margin-bottom: 10px;">💡 Tavsiyalar:</h4>
                        <ul style="margin-left: 20px; line-height: 2;">
                            <li>Faylni kichikroq qismlarga bo'ling</li>
                            <li>Rasmlarni siqing (compress)</li>
                            <li>Keraksiz sahifalarni o'chiring</li>
                            <li>Sifatni pasaytiring</li>
                        </ul>
                    </div>
                </div>
            `);
            return;
        }

        // Warning for large files
        if (fileSizeMB > 20) {
            Utils.notify(`⚠️ Katta fayl (${fileSizeMB.toFixed(1)}MB). Konvertatsiya biroz vaqt olishi mumkin...`, 'warning');
            AI.addMessage('ai', `
                <div style="background: rgba(255, 210, 0, 0.1); padding: 15px; border-radius: 10px;">
                    <p><strong>📊 Fayl hajmi:</strong> ${fileSizeMB.toFixed(2)} MB</p>
                    <p style="margin-top: 10px;">⏱️ Konvertatsiya 15-30 soniya olishi mumkin. Sabr qiling! ⚡</p>
                </div>
            `);
        } else if (fileSizeMB > 10) {
            AI.addMessage('ai', `
                <div style="background: rgba(79, 172, 254, 0.1); padding: 12px; border-radius: 8px;">
                    <p>📊 Fayl hajmi: ${fileSizeMB.toFixed(2)} MB</p>
                    <p style="margin-top: 8px; font-size: 14px;">⚡ O'rtacha hajmli fayl. Tez konvert qilamiz!</p>
                </div>
            `);
        }

        this.currentFile = file;
        this.fileName = file.name;
        this.fileType = file.name.split('.').pop().toLowerCase();

        const fileSize = Utils.formatFileSize(file.size);
        
        // Show file info
        const fileResult = $('fileResult');
        fileResult.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 42px;">${this.getFileIcon(this.fileType)}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; margin-bottom: 8px; font-size: 16px;">✅ ${file.name}</div>
                    <div style="color: var(--gray); font-size: 13px;">
                        📊 Hajm: ${fileSize} | 📋 Turi: ${this.fileType.toUpperCase()}
                    </div>
                </div>
            </div>
        `;
        fileResult.classList.remove('hidden');

        this.userStats.files++;
        this.updateStats();
        this.saveUserStats();

        Utils.log(Auth.currentUser, `Fayl yuklandi: ${file.name} (${fileSize})`, 'file');

        Utils.showLoading(true);

        try {
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            if (['xlsx', 'xls', 'csv'].includes(this.fileType)) {
                await this.processExcel(arrayBuffer);
            } else if (['docx', 'doc'].includes(this.fileType)) {
                await this.processWord(arrayBuffer);
            } else if (this.fileType === 'pdf') {
                await this.processPDF(arrayBuffer);
            } else if (this.fileType === 'txt') {
                await this.processText(arrayBuffer);
            } else if (['json', 'xml', 'html', 'css', 'js'].includes(this.fileType)) {
                await this.processCode(arrayBuffer);
            } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(this.fileType)) {
                await this.processImage(file);
            } else if (['mp3', 'wav', 'ogg', 'mp4', 'avi', 'mkv', 'mov'].includes(this.fileType)) {
                Utils.showLoading(false);
                Utils.notify('Audio/Video formatlar hozircha qo\'llab-quvvatlanmaydi', 'warning');
                AI.addMessage('ai', '🎵 Kechirasiz, audio va video konvertatsiya hozircha ishlab chiqilmoqda. Keyingi versiyada qo\'shiladi! 🚀');
                return;
            } else {
                Utils.showLoading(false);
                Utils.notify('Bu format hali qo\'llab-quvvatlanmaydi!', 'error');
                return;
            }

            this.showFormatOptions();

            // Ask for file analysis
            AI.currentFileAnalysis = AI.analyzeFile(file, this.fileData);
            
            AI.addMessage('ai', `✅ <strong>Fayl muvaffaqiyatli yuklandi!</strong><br><br>📄 <strong>Nomi:</strong> ${file.name}<br>📊 <strong>Hajmi:</strong> ${fileSize}<br>📋 <strong>Format:</strong> ${this.fileType.toUpperCase()}<br><br>🎯 Endi qaysi formatga o'tkazmoqchisiz? Pastdagi tugmalardan birini tanlang! 👇<br><br><div style="background: rgba(79, 172, 254, 0.1); padding: 15px; border-radius: 10px; margin-top: 15px;"><p style="font-size: 14px;">🔍 <strong>Faylni tahlil qilishni xohlaysizmi?</strong></p><p style="font-size: 14px; color: var(--gray); margin-top: 8px;">"ha", "tahlil" yoki "analiz" deb yozing!</p></div>`);

            Utils.notify('Fayl tayyor! Format tanlang.', 'success');
            Utils.showLoading(false);
        } catch (error) {
            console.error('File processing error:', error);
            Utils.notify('Faylni o\'qib bo\'lmadi! Qayta urinib ko\'ring.', 'error');
            Utils.log(Auth.currentUser, `Fayl xatosi: ${error.message}`, 'error');
            Utils.showLoading(false);
            
            AI.addMessage('ai', `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">❌ Xatolik yuz berdi!</h4>
                    <p><strong>Xato:</strong> ${error.message}</p>
                    <p style="margin-top: 15px;">💡 <strong>Tavsiyalar:</strong></p>
                    <ul style="margin-left: 20px; line-height: 2; margin-top: 10px;">
                        <li>Fayl buzilmagan ekanligini tekshiring</li>
                        <li>Boshqa fayl yuklang</li>
                        <li>Muammo davom etsa, "admin" ga murojaat qiling</li>
                    </ul>
                </div>
            `);
        }
    },

    getFileIcon(type) {
        const icons = {
            'xlsx': '📗', 'xls': '📗', 'csv': '📊',
            'docx': '📘', 'doc': '📘',
            'pdf': '📕',
            'txt': '📝',
            'json': '📋', 'xml': '📋',
            'html': '🌐', 'css': '🎨', 'js': '⚡',
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️'
        };
        return icons[type] || '📄';
    },

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    async processExcel(arrayBuffer) {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            this.fileData = {
                array: XLSX.utils.sheet_to_json(firstSheet, { header: 1 }),
                json: XLSX.utils.sheet_to_json(firstSheet),
                workbook: workbook,
                sheetNames: workbook.SheetNames
            };
        } catch (error) {
            throw new Error('Excel faylini o\'qib bo\'lmadi: ' + error.message);
        }
    },

    async processWord(arrayBuffer) {
        try {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            this.fileData = {
                html: result.value,
                text: result.value.replace(/<[^>]*>/g, '').trim()
            };
        } catch (error) {
            throw new Error('Word hujjatini o\'qib bo\'lmadi: ' + error.message);
        }
    },

    async processPDF(arrayBuffer) {
        try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            const pages = [];
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                
                fullText += pageText + '\n\n';
                pages.push(pageText);
            }
            
            this.fileData = {
                text: fullText.trim(),
                pages: pages,
                pageCount: pdf.numPages
            };
        } catch (error) {
            throw new Error('PDF faylini o\'qib bo\'lmadi: ' + error.message);
        }
    },

    async processText(arrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        this.fileData = decoder.decode(arrayBuffer);
    },

    async processCode(arrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        
        this.fileData = {
            raw: text,
            formatted: this.formatCode(text, this.fileType)
        };
    },

    async processImage(file) {
        this.fileData = {
            file: file,
            url: URL.createObjectURL(file),
            type: this.fileType
        };
    },

    formatCode(code, type) {
        try {
            if (type === 'json') {
                return JSON.stringify(JSON.parse(code), null, 2);
            }
            return code;
        } catch {
            return code;
        }
    },

    showFormatOptions() {
        const container = $('formatOptions');
        container.innerHTML = '';
        container.classList.remove('hidden');

        const formatMap = {
            'xlsx': ['PDF', 'CSV', 'TXT', 'HTML', 'JSON'],
            'xls': ['PDF', 'CSV', 'TXT', 'HTML', 'JSON'],
            'csv': ['XLSX', 'PDF', 'TXT', 'HTML', 'JSON'],
            'docx': ['PDF', 'TXT', 'HTML'],
            'doc': ['PDF', 'TXT', 'HTML'],
            'pdf': ['TXT', 'HTML'],
            'txt': ['PDF', 'HTML'],
            'json': ['XLSX', 'CSV', 'TXT', 'HTML'],
            'xml': ['JSON', 'TXT', 'HTML'],
            'html': ['PDF', 'TXT'],
            'css': ['TXT', 'HTML'],
            'js': ['TXT', 'HTML'],
            'png': ['PDF', 'JPG'],
            'jpg': ['PDF', 'PNG'],
            'jpeg': ['PDF', 'PNG']
        };

        const formats = formatMap[this.fileType] || ['TXT', 'PDF'];

        formats.forEach(format => {
            const btn = document.createElement('div');
            btn.className = 'format-btn';
            btn.innerHTML = `<div style="font-size: 28px; margin-bottom: 8px;">${this.getFormatIcon(format.toLowerCase())}</div><strong>${format}</strong>`;
            btn.onclick = () => this.convertTo(format.toLowerCase());
            container.appendChild(btn);
        });
    },

    async convertTo(targetFormat) {
        if (!this.fileData) {
            Utils.notify('Fayl yuklanmagan!', 'error');
            return;
        }

        const progressBar = $('progressBar');
        const progressFill = $('progressFill');
        const progressText = $('progressText');
        
        progressBar.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Tayyorlanmoqda...';

        // Smooth progress animation
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
                
                if (progress < 30) {
                    progressText.textContent = 'Fayl o\'qilmoqda...';
                } else if (progress < 60) {
                    progressText.textContent = 'Konvertatsiya jarayoni...';
                } else {
                    progressText.textContent = 'Yakunlanmoqda...';
                }
            }
        }, 50);

        try {
            // Give browser time to update UI
            await new Promise(resolve => setTimeout(resolve, 100));

            let blob, filename;
            const baseName = this.fileName.split('.').slice(0, -1).join('.');

            // Chunked processing for large files
            const isLargeFile = this.currentFile.size > 10 * 1024 * 1024;

            switch (targetFormat) {
                case 'pdf':
                    blob = await this.convertToPDF(isLargeFile);
                    filename = `${baseName}.pdf`;
                    break;
                case 'csv':
                    blob = await this.convertToCSV();
                    filename = `${baseName}.csv`;
                    break;
                case 'txt':
                    blob = await this.convertToTXT();
                    filename = `${baseName}.txt`;
                    break;
                case 'html':
                    blob = await this.convertToHTML();
                    filename = `${baseName}.html`;
                    break;
                case 'json':
                    blob = await this.convertToJSON();
                    filename = `${baseName}.json`;
                    break;
                case 'xlsx':
                    blob = await this.convertToXLSX();
                    filename = `${baseName}.xlsx`;
                    break;
                case 'png':
                case 'jpg':
                case 'jpeg':
                    blob = await this.convertImage(targetFormat);
                    filename = `${baseName}.${targetFormat}`;
                    break;
                default:
                    throw new Error('Unsupported format');
            }

            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = 'Tayyor! ✅';

            // Download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up URL after download
            setTimeout(() => URL.revokeObjectURL(url), 100);

            // Hide progress with delay
            setTimeout(() => {
                progressBar.classList.add('hidden');
                progressFill.style.width = '0%';
                $('formatOptions').classList.add('hidden');
            }, 1500);

            this.userStats.converts++;
            this.updateStats();
            this.saveUserStats();

            Utils.log(Auth.currentUser, `Convert: ${this.fileName} → ${targetFormat.toUpperCase()}`, 'convert');

            AI.addMessage('ai', `🎉 <strong>Muvaffaqiyatli!</strong><br><br>✅ <strong>${filename}</strong> yuklab olindi!<br><br>📊 Format: ${targetFormat.toUpperCase()}<br>💾 Hajm: ${Utils.formatFileSize(blob.size)}<br><br>🔄 Yana fayl convert qilmoqchimisiz? Yuqoridan yangi fayl yuklang!<br><br>${this.getConversionTip(targetFormat)}`);

            Utils.notify('Convert muvaffaqiyatli! ✅', 'success');
        } catch (error) {
            clearInterval(progressInterval);
            progressBar.classList.add('hidden');
            
            console.error('Conversion error:', error);
            Utils.notify('Convert xatosi! Qayta urinib ko\'ring.', 'error');
            Utils.log(Auth.currentUser, `Convert xatosi: ${error.message}`, 'error');
            
            AI.addMessage('ai', `
                <div style="background: rgba(255, 87, 108, 0.1); padding: 20px; border-radius: 12px;">
                    <h4 style="color: #f5576c; margin-bottom: 15px;">❌ Konvertatsiya Xatosi!</h4>
                    <p><strong>Xato:</strong> ${error.message}</p>
                    <p style="margin-top: 15px;">💡 <strong>Nima qilish kerak:</strong></p>
                    <ul style="margin-left: 20px; line-height: 2; margin-top: 10px;">
                        <li>Boshqa formatni tanlang</li>
                        <li>Faylni qayta yuklang</li>
                        <li>Fayl hajmini kamaytiring</li>
                        <li>Muammo hal bo'lmasa, "admin" ga murojaat qiling</li>
                    </ul>
                </div>
            `);
        }
    },

    getConversionTip(format) {
        const tips = {
            'pdf': '💡 PDF formatda saqlandi - har qanday qurilmada ochish mumkin!',
            'csv': '💡 CSV formatda - Excel yoki Google Sheets da ochish mumkin!',
            'xlsx': '💡 Excel formatda - jadval sifatida ishlash qulay!',
            'txt': '💡 TXT formatda - har qanday matn muharririda ochiladi!',
            'html': '💡 HTML formatda - brauzerda ochib ko\'ring!',
            'json': '💡 JSON formatda - dasturlashda ishlatish uchun qulay!'
        };
        return tips[format] || '💡 Muvaffaqiyatli konvert qilindi!';
    },

    async convertToPDF(isLargeFile) {
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let text = '';
        
        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else if (this.fileData.array) {
            text = this.fileData.array.map(row => row.join(', ')).join('\n');
        } else if (this.fileData.html) {
            text = this.fileData.text;
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        // Chunked processing for large text
        const maxCharsPerPage = 3000;
        const chunks = [];
        
        if (isLargeFile && text.length > maxCharsPerPage) {
            for (let i = 0; i < text.length; i += maxCharsPerPage) {
                chunks.push(text.substring(i, i + maxCharsPerPage));
                // Give browser time to breathe
                if (chunks.length % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        } else {
            chunks.push(text);
        }

        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let page = pdfDoc.addPage([595, 842]);
            let y = 800;
            const lineHeight = 14;
            const margin = 50;
            const maxWidth = 495;

            for (const line of lines) {
                if (y < 50) {
                    page = pdfDoc.addPage([595, 842]);
                    y = 800;
                }

                const wrappedLines = this.wrapText(line || '', font, 11, maxWidth);
                
                for (const wrappedLine of wrappedLines) {
                    if (y < 50) {
                        page = pdfDoc.addPage([595, 842]);
                        y = 800;
                    }
                    
                    try {
                        page.drawText(wrappedLine, {
                            x: margin,
                            y: y,
                            size: 11,
                            font: font,
                            color: rgb(0, 0, 0)
                        });
                    } catch (e) {
                        // Skip problematic characters
                        console.warn('Skipping problematic text:', e);
                    }
                    
                    y -= lineHeight;
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    },

    wrapText(text, font, fontSize, maxWidth) {
        if (!text) return [''];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            
            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) lines.push(currentLine);
        return lines.length > 0 ? lines : [''];
    },

    async convertToCSV() {
        let csvContent = '';

        if (this.fileData.array) {
            csvContent = this.fileData.array.map(row => 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
        } else if (this.fileData.json) {
            const worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
            csvContent = XLSX.utils.sheet_to_csv(worksheet);
        } else {
            csvContent = JSON.stringify(this.fileData);
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    },

    async convertToTXT() {
        let text = '';

        if (typeof this.fileData === 'string') {
            text = this.fileData;
        } else if (this.fileData.text) {
            text = this.fileData.text;
        } else if (this.fileData.array) {
            text = this.fileData.array.map(row => row.join('\t')).join('\n');
        } else if (this.fileData.raw) {
            text = this.fileData.raw;
        } else {
            text = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([text], { type: 'text/plain;charset=utf-8;' });
    },

    async convertToHTML() {
        let html = '';

        if (this.fileData.html) {
            html = this.fileData.html;
        } else if (this.fileData.array) {
            html = '<table border="1" style="border-collapse: collapse; width: 100%;"><tbody>';
            this.fileData.array.forEach((row, i) => {
                html += '<tr>';
                row.forEach(cell => {
                    const tag = i === 0 ? 'th' : 'td';
                    html += `<${tag} style="padding: 8px; border: 1px solid #ddd;">${cell}</${tag}>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        } else {
            html = `<pre style="font-family: monospace; padding: 20px; background: #f5f5f5;">${JSON.stringify(this.fileData, null, 2)}</pre>`;
        }

        const fullHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #667eea; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>${this.fileName}</h1>
    ${html}
</body>
</html>`;

        return new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
    },

    async convertToJSON() {
        let json = '';

        if (this.fileData.json) {
            json = JSON.stringify(this.fileData.json, null, 2);
        } else if (this.fileData.array) {
            const headers = this.fileData.array[0];
            const data = this.fileData.array.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = row[i];
                });
                return obj;
            });
            json = JSON.stringify(data, null, 2);
        } else {
            json = JSON.stringify(this.fileData, null, 2);
        }

        return new Blob([json], { type: 'application/json;charset=utf-8;' });
    },

    async convertToXLSX() {
        let worksheet;

        if (this.fileData.array) {
            worksheet = XLSX.utils.aoa_to_sheet(this.fileData.array);
        } else if (this.fileData.json) {
            worksheet = XLSX.utils.json_to_sheet(this.fileData.json);
        } else if (typeof this.fileData === 'object') {
            const data = [[JSON.stringify(this.fileData)]];
            worksheet = XLSX.utils.aoa_to_sheet(data);
        } else {
            const data = this.fileData.split('\n').map(line => [line]);
            worksheet = XLSX.utils.aoa_to_sheet(data);
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },

    async convertImage(targetFormat) {
        // Simple blob conversion for images
        return this.fileData.file;
    },

    updateStats() {
        $('fileCount').textContent = this.userStats.files;
        $('convertCount').textContent = this.userStats.converts;
        $('msgCount').textContent = this.userStats.messages;
    },

    loadUserStats(username) {
        this.userStats = Storage.load(`stats_${username}`, { files: 0, converts: 0, messages: 0 });
        this.updateStats();
    },

    saveUserStats() {
        Storage.save(`stats_${Auth.currentUser}`, this.userStats);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Brain.init();
});