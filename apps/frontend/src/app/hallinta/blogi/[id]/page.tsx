import { prisma } from '@/server/db';
import { deletePost } from '@/server/blog-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import BlogPostForm from './BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function BlogPostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const isNew = id === 'uusi';

  let post = null;

  if (!isNew) {
    post = await prisma.post.findUnique({
      where: { id },
    });
    if (!post) {
      redirect('/hallinta/blogi');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hallinta/blogi" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isNew ? 'Uusi kirjoitus' : 'Muokkaa kirjoitusta'}
            </h1>
          </div>
        </div>
        
        {!isNew && (
            <form action={async () => {
                'use server';
                await deletePost(id);
                redirect('/hallinta/blogi');
            }}>
                <button 
                    type="submit" 
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Trash2 size={18} />
                    Poista
                </button>
            </form>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <BlogPostForm post={post} isNew={isNew} id={id} />
      </div>
    </div>
  );
}
