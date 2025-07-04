import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  contactForm: ContactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  };

  isSubmitting = false;
  isSubmitted = false;

  subjects = [
    'General Inquiry',
    'Property Listing',
    'Buying Property',
    'Selling Property',
    'Technical Support',
    'Partnership',
  ];

  onSubmit(): void {
    if (this.isValidForm()) {
      this.isSubmitting = true;

      setTimeout(() => {
        console.log('📧 Contact Form Submitted:', this.contactForm);
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.resetForm();

        setTimeout(() => {
          this.isSubmitted = false;
        }, 3000);
      }, 2000);
    }
  }

  private isValidForm(): boolean {
    return !!(
      this.contactForm.name &&
      this.contactForm.email &&
      this.contactForm.subject &&
      this.contactForm.message
    );
  }

  private resetForm(): void {
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    };
  }
}
