import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Flame, Crosshair, Target, Shield, Music2, Facebook, Instagram, Gamepad2, Eye, Star, ShieldCheck, TrendingUp, User, MessageSquare, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { GameListing, ListingStatus, OrderStatus } from "../lib/types";
import { statusClass, statusLabel, classNames, IconType } from "../lib/utils";

const fallbackImages = [
  "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/16707738/pexels-photo-16707738.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const gameIcons: Record<string, IconType> = {
  "Free Fire": Flame, "PUBG Mobile": Crosshair, "Call of Duty Mobile": Target,
  "Clash of Clans": Shield, TikTok: Music2, Facebook: Facebook, Instagram: Instagram,
};

export function StatusBadge({ status }: { status: ListingStatus | OrderStatus }) {
  return <span className={classNames("badge border", statusClass(status))}>{statusLabel(status)}</span>;
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-44 bg-ink-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-20 rounded bg-ink-800" />
        <div className="h-5 w-full rounded bg-ink-800" />
        <div className="h-4 w-2/3 rounded bg-ink-800" />
        <div className="flex justify-between pt-2"><div className="h-6 w-16 rounded bg-ink-800" /><div className="h-6 w-12 rounded bg-ink-800" /></div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: IconType; title: string; subtitle?: string }) {
  return (
    <div className="card p-12 text-center">
      <Icon size={40} className="mx-auto text-ink-600" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// Image Gallery Modal Component
function ImageGalleryModal({ 
  images, 
  currentIndex, 
  onClose 
}: { 
  images: string[]; 
  currentIndex: number; 
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Keyboard navigation
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10 bg-black/50 p-2 rounded-full"
      >
        <X size={28} />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-1.5 rounded-full">
        {selectedIndex + 1} / {images.length}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
        <button onClick={handleZoomOut} className="text-white hover:text-gray-300 p-1.5 transition">
          <ZoomOut size={22} />
        </button>
        <span className="text-white text-xs flex items-center px-2 min-w-[40px] justify-center">{Math.round(zoomLevel * 100)}%</span>
        <button onClick={handleZoomIn} className="text-white hover:text-gray-300 p-1.5 transition">
          <ZoomIn size={22} />
        </button>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 text-white hover:text-gray-300 transition bg-black/50 p-2 rounded-full hover:bg-black/70"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 text-white hover:text-gray-300 transition bg-black/50 p-2 rounded-full hover:bg-black/70"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Main Image */}
      <div className="w-[95vw] h-[75vh] flex items-center justify-center overflow-hidden">
        <img
          src={images[selectedIndex]}
          alt={`Product image ${selectedIndex + 1}`}
          style={{ 
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease'
          }}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[85vw] overflow-x-auto p-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedIndex(idx); setZoomLevel(1); }}
              className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                idx === selectedIndex ? 'border-primary-500' : 'border-transparent hover:border-gray-500'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingCard({ listing }: { listing: GameListing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const images = listing.images && listing.images.length > 0 ? listing.images : fallbackImages;
  const img = images[0];
  const GameIcon = gameIcons[listing.game_name] ?? Gamepad2;
  const isOwn = !!user && user.id === listing.seller_id;
  const canMessage = !!user && !isOwn && (listing.status === "active" || listing.status === "approved");

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If click is on image or its children, don't navigate
    const target = e.target as HTMLElement;
    if (target.closest('.image-wrapper')) {
      return;
    }
    navigate(`/listing/${listing.id}`);
  };

  return (
    <>
      <div 
        className="card-hover overflow-hidden block group cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative h-44 overflow-hidden image-wrapper">
          <img 
            src={img} 
            alt={listing.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-zoom-in" 
            loading="lazy"
            onClick={(e) => handleImageClick(e, 0)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent pointer-events-none" />
          
          {/* Image count badge if multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
              {images.length} images
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2 pointer-events-none">
            <span className="badge glass text-white"><GameIcon size={12} /> {listing.game_name}</span>
          </div>
          {listing.is_featured && (
            <span className="absolute top-3 right-3 badge bg-accent-500/90 text-ink-950 font-bold pointer-events-none"><Star size={12} className="fill-ink-950" /> Featured</span>
          )}
          {listing.status === "sold" && (
            <div className="absolute inset-0 grid place-items-center bg-ink-950/60 pointer-events-none"><span className="badge border border-ink-600 bg-ink-900 text-ink-300">SOLD</span></div>
          )}
          {canMessage && (
            <RouterLink
              to={`/messages?listing=${listing.id}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-ink-950/80 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/15 opacity-0 backdrop-blur transition-all hover:bg-primary-500 hover:text-ink-950 group-hover:opacity-100 pointer-events-auto"
              title="Message seller about this listing"
              aria-label="Message seller"
            >
              <MessageSquare size={13} />
              <span>Message</span>
            </RouterLink>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">{listing.title}</h3>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
            {listing.rank_tier && <span className="flex items-center gap-1"><TrendingUp size={12} className="text-accent-400" /> {listing.rank_tier}</span>}
            <span className="flex items-center gap-1"><Eye size={12} /> {listing.view_count}</span>
          </div>
          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-1 gap-y-2 max-h-[4.25rem] overflow-hidden">
              {listing.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-accent-500/10 px-2.5 py-1 text-[11px] font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="font-display text-xl font-extrabold text-white">৳<span className="ml-1">{listing.price.toLocaleString()}</span></span>
            {listing.seller && (
              <span className="flex items-center gap-1 text-xs min-w-0">
                <User size={13} className="text-accent-400 shrink-0" />
                <span className="font-medium text-accent-200 whitespace-nowrap">{listing.seller.full_name ?? listing.seller.username}</span>
                {listing.seller.is_verified && <ShieldCheck size={13} className="text-success-400 shrink-0" />}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isModalOpen && (
        <ImageGalleryModal
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export { Link };
