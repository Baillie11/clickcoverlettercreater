# Click Cover Letter Creator

A modern, interactive web application for creating professional cover letters using a drag-and-drop interface.

## 🌟 Features

### ✨ **Core Functionality**
- **Drag & Drop Interface** - Intuitive letter building by dragging response snippets
- **Response Library** - Pre-loaded crowd-sourced and AI-generated responses
- **Custom Responses** - Add, edit, and delete your own response templates
- **User Profile Management** - Auto-saves personal information (name, address)
- **Letter Building** - Sortable paragraphs with easy removal
- **PDF Export** - Professional formatting with intelligent file naming
- **Local Storage** - All data persists in your browser

### 🎯 **User Experience**
- **Professional Design** - Clean, modern interface
- **Responsive Layout** - Works on desktop and mobile
- **Real-time Saving** - Profile and responses auto-save
- **Keyboard Shortcuts** - Ctrl+Enter to quickly add responses
- **Confirmation Dialogs** - Prevents accidental data loss
- **Error Handling** - Graceful handling of storage limitations

## 🚀 **Quick Start**

1. **Open `index.html`** in any modern web browser
2. **Fill in your profile** information (name, address)
3. **Drag responses** from the library to build your letter
4. **Customize** by adding your own response snippets
5. **Export as PDF** with professional formatting

## 📁 **Project Structure**

```
Click Cover Letter Creator/
├── index.html          # Main application page
├── styles.css          # Complete styling and responsive design
├── script.js           # Full application logic (~18KB)
├── favicon.svg         # Briefcase icon
└── README.md           # This documentation
```

## 🛠 **Technology Stack**

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Dependencies**: 
  - [SortableJS](https://sortablejs.github.io/Sortable/) - Drag & drop functionality
  - [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) - PDF generation
- **Storage**: Browser localStorage
- **No Backend Required** - Fully client-side application

## 🌐 **Deployment**

### **Netlify (Recommended)**
1. Drag the project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Your app will be live instantly with a generated URL
3. No configuration required

### **GitHub Pages**
1. Push this repository to GitHub
2. Enable GitHub Pages in repository settings
3. Your app will be available at `https://username.github.io/repository-name`

### **Local Development**
Simply open `index.html` in your browser - no server required!

## 📝 **Usage Guide**

### **Building Your First Cover Letter**
1. **Enter Personal Info**: Fill in your name and address in the "Your Info" section
2. **Add Job Details**: Complete the job information form
3. **Select Responses**: Browse the response library (User Created, Crowd Sourced, AI Generated)
4. **Drag to Build**: Drag response snippets to the letter building area
5. **Customize Order**: Rearrange paragraphs by dragging within the letter area
6. **Remove Unwanted**: Click the × button on any paragraph to remove it
7. **Export**: Click "Download as PDF" for a professionally formatted document

### **Managing Custom Responses**
- **Add**: Type in the text area and click "Add Response"
- **Edit**: Click the ✏️ icon on any user-created response
- **Delete**: Click the 🗑️ icon to remove custom responses
- **Shortcut**: Use Ctrl+Enter in the text area to quickly add responses

### **Letter Management**
- **New Letter**: Clear current work and start fresh
- **Save Locally**: Store letters in browser storage for later retrieval
- **PDF Export**: Generate professional PDFs with intelligent naming

## 🔧 **Technical Details**

### **Data Storage**
- **User Profile**: `localStorage['userProfile']`
- **Response Library**: `localStorage['responses']`
- **Saved Letters**: `localStorage['savedLetters']`

### **Browser Compatibility**
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- IE11+: Basic support (some ES6 features may need polyfills)

### **Security Features**
- **Input Sanitization**: HTML tags stripped from user input
- **XSS Prevention**: All user content properly escaped
- **No Server Communication**: All data stays in your browser

## 🎨 **Customization**

The application uses CSS custom properties and is designed to be easily themeable. Key color schemes:

- **User Responses**: Light blue (`#E0F7FA`)
- **Crowd-sourced**: Light orange (`#FFF3E0`)
- **AI Generated**: Light purple (`#F3E5F5`)

## 🤝 **Contributing**

This is a complete, production-ready application. However, potential enhancements could include:

- **Cloud Storage Integration** (Google Drive, Dropbox)
- **Template Variations** (different letter formats)
- **Company Database** (auto-fill company information)
- **Collaboration Features** (share responses)
- **Analytics** (track letter success rates)

## 📄 **License**

This project is open source and available under the MIT License.

## 🆘 **Support**

If you encounter any issues:

1. **Clear Browser Cache** - Refresh the page
2. **Check Browser Console** - Look for JavaScript errors
3. **Disable Extensions** - Some browser extensions may interfere
4. **Try Incognito Mode** - Rule out extension conflicts

---

**Built with ❤️ for job seekers everywhere**

*Last updated: September 22, 2025*