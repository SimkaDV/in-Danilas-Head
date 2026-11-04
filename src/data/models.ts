import { getCollection } from 'astro:content';

// только одобренные модели, в порядке поля order
export async function getApprovedModels() {
  const models = await getCollection('models', ({ data }) => data.status === 'approved');
  return models.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

export const modelHref = (id: string) => `/catalog/${id}/`;
