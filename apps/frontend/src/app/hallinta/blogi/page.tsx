import { prisma } from '@/server/db';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Wand2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        publishedAt: true,
        authorName: true,
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blogi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Hallinnoi blogikirjoituksia.</p>
        </div>
        <div className="flex gap-3">
             <Link 
                href="/hallinta/blogi/ai-wizard"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Wand2 size={18} />
              AI-velho
            </Link>
            <Link 
                href="/hallinta/blogi/uusi"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Uusi kirjoitus
            </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4">Otsikko</th>
                <th className="px-6 py-4">Tila</th>
                <th className="px-6 py-4">Julkaistu</th>
                <th className="px-6 py-4">Kirjoittaja</th>
                <th className="px-6 py-4 text-right">Toiminnot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{post.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    {post.published ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Julkaistu
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Luonnos
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fi-FI') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {post.authorName || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link href={`/blog/${post.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Katso">
                            <Eye size={18} />
                        </Link>
                        <Link href={`/hallinta/blogi/${post.id}`} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Muokkaa">
                            <Edit size={18} />
                        </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Ei blogikirjoituksia. Luo ensimmäinen!
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}