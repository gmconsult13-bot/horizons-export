import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, RefreshCcw, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const fetchGallery = async () => {
    setLoading(true);
    setError(false);
    try {
      const records = await pb.collection('gallery').getFullList({ sort: '-created', $autoCancel: false });
      setImages(records);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGallery(); }, []);

  const categories = ['all', 'room', 'amenity', 'dining', 'lobby', 'exterior'];
  const filteredImages = filter === 'all' ? images : images.filter(i => i.category === filter);

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const nextImage = (e) => {
    e.stopPropagation();
    setSelectedIndex(prev => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  };
  
  const prevImage = (e) => {
    e.stopPropagation();
    setSelectedIndex(prev => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Gallery | Raya Boutique</title></Helmet>
      <Header />
      
      <main className="flex-grow">
        <section className="py-24 px-4 text-center bg-card border-b border-border">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-foreground">Our Gallery</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Explore the spaces, details, and atmosphere that make Raya Boutique uniquely serene.</p>
        </section>

        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className={`w-full rounded-xl mb-4 ${i%2===0 ? 'h-64' : 'h-48'}`} />)}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">We couldn't load the gallery.</p>
              <Button onClick={fetchGallery} variant="outline"><RefreshCcw className="w-4 h-4 mr-2"/> Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 justify-center mb-10">
                {categories.map(c => (
                  <Button 
                    key={c} 
                    variant={filter === c ? "default" : "outline"}
                    onClick={() => setFilter(c)}
                    className={`capitalize ${filter === c ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    {c}
                  </Button>
                ))}
              </div>

              {filteredImages.length > 0 ? (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                  {filteredImages.map((img, idx) => (
                    <div 
                      key={img.id} 
                      className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm"
                      onClick={() => openLightbox(idx)}
                    >
                      <img 
                        src={pb.files.getURL(img, img.image, { thumb: '300x300' })} 
                        alt={img.title} 
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <h4 className="text-white font-medium">{img.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No images found for this category.</p>
              )}
            </>
          )}
        </section>

        <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
          <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-black/95 border-none flex flex-col shadow-none">
            {selectedIndex !== null && (
              <>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 rounded-full" onClick={closeLightbox}>
                  <X className="w-6 h-6" />
                </Button>
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                  <Button variant="ghost" size="icon" className="absolute left-4 text-white hover:bg-white/20 h-12 w-12 rounded-full z-10" onClick={prevImage}>
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <img 
                    src={pb.files.getURL(filteredImages[selectedIndex], filteredImages[selectedIndex].image)} 
                    alt={filteredImages[selectedIndex].title}
                    className="max-w-full max-h-full object-contain"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-4 text-white hover:bg-white/20 h-12 w-12 rounded-full z-10" onClick={nextImage}>
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </div>
                <div className="p-6 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full text-center">
                  <h3 className="text-2xl font-serif text-white mb-2">{filteredImages[selectedIndex].title}</h3>
                  {filteredImages[selectedIndex].description && (
                    <p className="text-white/80 max-w-2xl mx-auto text-sm">{filteredImages[selectedIndex].description}</p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}