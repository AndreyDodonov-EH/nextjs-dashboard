'use server'
import { sql } from '@vercel/postgres';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };
    // THIS WILL BE LOGGED IN THE TERMINAL, NOT IN THE FRONT END, AS LONG AS IT IS SERVER COMPONENT!
    console.log(rawFormData);
    const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    }
    catch (error) {
        console.error(error);
        return {message: 'Database Error: Failed to Create Invoice'};
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    // Use Zod to update the expected types
    const UpdateInvoice = FormSchema.omit({ id: true, date: true });

    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
    try {
        await sql`
          UPDATE invoices
          SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
          WHERE id = ${id}
        `;
    }
    catch (error) {
        console.error(error);
        return {message: 'Database Error: Failed to Update Invoice'};
    }
    revalidatePath('/dashboard/invoices');

    // should always be called in the end (at least for server actions?)
    // code after it is unreachable
    // because it works by throwing an error
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    throw new Error('Anus Sex!');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        return {message: 'Database Error: Failed to Delete Invoice'};
    }
    revalidatePath('/dashboard/invoices');
  }
