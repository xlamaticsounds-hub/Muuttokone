'use client';
import React, { useState } from 'react';
import formData from '@/features/contact/formData';
import toast from 'react-hot-toast';
import { contactSchema } from '@/lib/schemas';
import { submitContact } from '@/server/actions';

export default function ContactFormBox() {
  const [data, setData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Client-side validation
    const result = contactSchema.safeParse(data);
    if (!result.success) {
      result.error.errors.forEach((error) => {
        toast.error(error.message);
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData from the validated data
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Submit with server action
      const response = await submitContact(formData);

      if (response.success) {
        toast.success(response.message || 'Viesti lähetetty onnistuneesti!');
        // Reset form
        setData({
          name: '',
          email: '',
          subject: '',
          message: '',
          phone: '',
        });
      } else {
        // Handle field errors
        if (response.fieldErrors) {
          Object.values(response.fieldErrors).forEach((error) => {
            toast.error(error);
          });
        } else {
          toast.error(response.error || 'Viestin lähetys epäonnistui');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Odottamaton virhe tapahtui');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="animate_top shadow-3 w-full rounded-lg bg-white p-7.5 md:w-3/5 lg:w-2/3 xl:p-14 dark:bg-black">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 flex-col gap-7.5 lg:grid-cols-2 lg:gap-10 lg:gap-y-7.5">
            {formData.map((item, index) =>
              item.type === 'message' ? (
                <div key={index} className="col-span-2 mb-10">
                  <label htmlFor={item.name} className="mb-4 block">
                    {item.label}
                  </label>

                  <textarea
                    rows={4}
                    id={item.name}
                    placeholder={item.placeholder}
                    name={item.name}
                    onChange={(e) => handleChange(e)}
                    required
                    className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent p-6 focus-visible:outline-hidden dark:shadow-none"
                  ></textarea>
                </div>
              ) : (
                <div key={index} className="w-full">
                  <label htmlFor={item.name} className="mb-4 block">
                    {item.label}
                  </label>

                  <input
                    type={item.type}
                    id={item.name}
                    name={item.name}
                    placeholder={item.placeholder}
                    autoComplete={item.autocomplete}
                    onChange={(e) => handleChange(e)}
                    required
                    className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-5 dark:border-stroke dark:focus:border-primary w-full rounded-lg border bg-transparent px-6 py-3.5 focus-visible:outline-hidden dark:shadow-none"
                  />
                </div>
              ),
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:shadow-1 inline-flex rounded-full px-7.5 py-3 text-white duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Lähetetään...' : 'Lähetä viesti'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
