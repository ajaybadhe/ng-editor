import { Component, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList, Renderer2, ViewEncapsulation } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None // Disables View Encapsulation
})
export class AppComponent {
  @ViewChild('editor') editor!: QuillEditorComponent; // Reference to the Quill editor component
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
   // Track the index of the currently active item
   activeIndex: number | null = null;
  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2) {}
   // Sidebar items available to drag
   items = ['Heading', 'Paragraph', 'Image', 'Divider', 'Spacer', 'Button', 'Social', 'Simple Form'];
  
   // Items that are dropped on the canvas
   droppedItems: Array<{ label: string; type: string; htmlContent: SafeHtml, isEditing: boolean }> = [];
 
   settings = {
     width: 400,
     height: 400
   };
 
   // Custom toolbar configuration for ngx-quill
   editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: 1 }, { header: 2 }],
      ['link', 'image'],
      ['clean'],
    ]
  };

  currentElement: HTMLElement | null = null; // Currently selected element to edit
  isEditing = false;
  initialContent = ''; // Store initial content before editing

  // Function to generate and sanitize HTML content based on item type
  generateHtmlContent(type: string): SafeHtml {
    let html = '';
    switch (type) {
      case 'Heading':
        html = `<h1>Heading Content</h1>`;
        break;
      case 'Paragraph':
        html = `<p>This is a sample paragraph text.</p>`;
        break;
      case 'Image':
        html = `<img src="https://via.placeholder.com/150" alt="Placeholder Image">`;
        break;
      case 'Divider':
        html = `<hr>`;
        break;
      case 'Spacer':
        html = `<div style="height: 20px;"></div>`;
        break;
      case 'Button':
        html = `<button style="padding: 10px; background-color: #007bff; color: #fff; border: none;">Click Me</button>`;
        break;
      case 'Social':
        html = `<div><a href="#" style="margin-right: 5px;">Facebook</a><a href="#">Twitter</a></div>`;
        break;
      case 'Simple Form':
        html = `
          <div class="form-container">
            <h2>Simple Form</h2>
            <p>Please fill in the details in the form. You can customize the text and add/delete more fields if needed.</p>
            <div class="form-field">
              <label>First name*</label>
              <input type="text" placeholder="First name">
            </div>
            <div class="form-field">
              <label>Last name*</label>
              <input type="text" placeholder="Last name">
            </div>
            <div class="form-field">
              <label>Email*</label>
              <input type="email" placeholder="Enter email">
            </div>
            <button class="submit-button">Submit</button>
          </div>`;
        break;
      default:
        html = `<div>Unknown Component</div>`;
    }
    // Sanitize the HTML content
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
   // Drop handler function to insert or reorder items in the canvas
  onDrop(event: CdkDragDrop<any[]>) {
     if (event.previousContainer === event.container) {
       // If dragged within the canvas, reorder the items
       moveItemInArray(this.droppedItems, event.previousIndex, event.currentIndex);
     } else {
       // If dragged from the sidebar, add a new item at the dropped position
       const type = event.item.data;
       const newItem = { 
         label: type, 
         type: type.toLowerCase(), 
         htmlContent: this.generateHtmlContent(type),
         isEditing: false // Add isEditing flag to control edit mode 
       };
       this.droppedItems.splice(event.currentIndex, 0, newItem); // Insert the new item at the drop position
     }
   }
 
   // Function to delete an item from the canvas
   deleteItem(index: number) {
     this.droppedItems.splice(index, 1);
     if (this.activeIndex === index) {
      this.activeIndex = null; // Reset active index if the active item is deleted
    }
   }
    // Function to move an item up
  moveUp(index: number) {
    if (index > 0) {
      [this.droppedItems[index - 1], this.droppedItems[index]] = [this.droppedItems[index], this.droppedItems[index - 1]];
    }
  }

  // Function to move an item down
  moveDown(index: number) {
    if (index < this.droppedItems.length - 1) {
      [this.droppedItems[index + 1], this.droppedItems[index]] = [this.droppedItems[index], this.droppedItems[index + 1]];
    }
  }

   // Handle clicks on the document to apply editor on the clicked element
   onElementClick(event: Event): void {
    const target = event.target as HTMLElement;
    console.log(target, 'target')
    // Prevent applying the editor to the editor itself or the toolbar
    if (target.closest('.editor-container') || target.tagName === 'BUTTON') {
      return;
    }

    // Set up the editor on the clicked element
    this.currentElement = target;
    this.initialContent = target.innerHTML; // Store initial content for editing
    this.isEditing = true;

    // Set editor content
    setTimeout(() => {
      if (this.editor && this.editor.quillEditor) {
        this.editor.quillEditor.root.innerHTML = this.initialContent;
      }
    }, 0);

    // Position the editor container over the target element
    const rect = target.getBoundingClientRect();
    this.renderer.setStyle(this.editorContainer.nativeElement, 'top', `${rect.top + window.scrollY}px`);
    this.renderer.setStyle(this.editorContainer.nativeElement, 'left', `${rect.left + window.scrollX}px`);
    this.renderer.setStyle(this.editorContainer.nativeElement, 'width', `${rect.width}px`);
    this.renderer.setStyle(this.editorContainer.nativeElement, 'display', 'block');
  }

   // Function to set the active index when an item is clicked
   setActive(index: number) {
    console.log(index, 'index')
    this.activeIndex = index;
  }
   // Save edited content back to the original element and hide editor
   saveContent(): void {
    if (this.currentElement && this.editor && this.editor.quillEditor) {
      const editedContent = this.editor.quillEditor.root.innerHTML;
      this.currentElement.innerHTML = editedContent;
    }
    this.closeEditor();
  }

  // Close the editor without saving
  closeEditor(): void {
    this.isEditing = false;
    this.renderer.setStyle(this.editorContainer.nativeElement, 'display', 'none');
  }

}
