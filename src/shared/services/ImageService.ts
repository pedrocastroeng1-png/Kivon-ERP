import { supabase } from '@/src/shared/lib/supabase';

const PHOTO_SIGNED_URL_EXPIRATION = 300; // 5 minutos
const CACHE_EXPIRATION_BUFFER = 30; // 30 segundos de margem de segurança

interface CacheEntry {
  url: string;
  expiresAt: number; // timestamp em ms
}

class ImageService {
  private cache: Map<string, CacheEntry> = new Map();

  async getPresencePhoto(storagePath: string): Promise<string | null> {
    if (!storagePath) return null;

    const now = Date.now();
    const cached = this.cache.get(storagePath);

    // Retorna do cache se ainda for válido (com margem de segurança)
    if (cached && cached.expiresAt > now + (CACHE_EXPIRATION_BUFFER * 1000)) {
      return cached.url;
    }

    try {
      const { data, error } = await supabase.storage
        .from('presence-photos')
        .createSignedUrl(storagePath, PHOTO_SIGNED_URL_EXPIRATION);
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao gerar signed URL da evidência', error);
        }
        return null;
      }

      if (data?.signedUrl) {
        // Armazena no cache com o tempo de expiração
        this.cache.set(storagePath, {
          url: data.signedUrl,
          expiresAt: now + (PHOTO_SIGNED_URL_EXPIRATION * 1000)
        });
        return data.signedUrl;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro inesperado ao gerar signed URL', err);
      }
    }

    return null;
  }

  async uploadPresencePhoto(storagePath: string, file: Blob, contentType: string = 'image/jpeg'): Promise<void> {
    const { error } = await supabase.storage
      .from('presence-photos')
      .upload(storagePath, file, { contentType });
    
    if (error) {
      throw error;
    }
  }

  async removePresencePhoto(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('presence-photos')
      .remove([storagePath]);
      
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao remover foto do storage', error);
      }
      throw error;
    }
    
    this.invalidateCache(storagePath);
  }

  invalidateCache(storagePath: string): void {
    this.cache.delete(storagePath);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const imageService = new ImageService();
