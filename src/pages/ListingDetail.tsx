import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Eye, Star, TrendingUp, Loader2, MessageSquare, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Review, Profile } from "../lib/types";
import { formatBDT, timeAgo, classNames } from "../lib/utils";
import { StatusBadge } from "../components/ListingCard";

// Image Gallery Modal Component - With Pinch Zoom
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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Pinch zoom states
  const [pinchStartDist, setPinchStartDist] = useState(0);
  const [pinchStartScale, setPinchStartScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale((prev) => {
      const newScale = Math.max(prev - 0.3, 0.5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  // Mouse wheel zoom (for desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.2, 3));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - 0.2, 0.5);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    }
  };

  // Mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLastPosition({ x: position.x, y: position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition({
        x: lastPosition.x + deltaX,
        y: lastPosition.y + deltaY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // FIXED: Get distance between two fingers - using TouchList properly
  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // PINCH ZOOM - Touch start
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    
    if (touches.length === 2) {
      // Pinch zoom started
      setIsPinching(true);
      const dist = getDistance(touches);
      setPinchStartDist(dist);
      setPinchStartScale(scale);
    } else if (touches.length === 1 && scale > 1) {
      // Single finger drag (pan)
      const touch = touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setLastPosition({ x: position.x, y: position.y });
    }
  };

  // PINCH ZOOM - Touch move
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    
    if (touches.length === 2 && isPinching) {
      // Pinch zoom
      e.preventDefault();
      const dist = getDistance(touches);
      const delta = dist / pinchStartDist;
      let newScale = Math.min(Math.max(pinchStartScale * delta, 0.5), 3);
      setScale(newScale);
      
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (touches.length === 1 && isDragging && scale > 1) {
      // Pan
      e.preventDefault();
      const touch = touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      setPosition({
        x: lastPosition.x + deltaX,
        y: lastPosition.y + deltaY
      });
    }
  };

  // PINCH ZOOM - Touch end
  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
  };

  // Double click/tap to reset
  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Reset position when scale goes back to 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  if (!images || images.length === 0) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center select-none touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-20 bg-black/50 p-2 rounded-full hover:bg-black/70"
      >
        <X size={28} />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-1.5 rounded-full z-20">
        {selectedIndex + 1} / {images.length}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm z-20">
        <button 
          onClick={handleZoomOut} 
          className="text-white hover:text-gray-300 p-1.5 transition"
        >
          <ZoomOut size={22} />
        </button>
        <span className="text-white text-xs flex items-center px-2 min-w-[40px] justify-center">{Math.round(scale * 100)}%</span>
        <button 
          onClick={handleZoomIn} 
          className="text-white hover:text-gray-300 p-1.5 transition"
        >
          <ZoomIn size={22} />
        </button>
      </div>

      {/* Navigation Buttons - hide when zoomed */}
      {images.length > 1 && scale === 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-4 text-white hover:text-gray-300 transition bg-black/50 p-1.5 md:p-2 rounded-full hover:bg-black/70 z-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-4 text-white hover:text-gray-300 transition bg-black/50 p-1.5 md:p-2 rounded-full hover:bg-black/70 z-20"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ cursor: scale > 1 ? 'grab' : 'default' }}
      >
        <img
          src={images[selectedIndex]}
          alt={`Product image ${selectedIndex + 1}`}
          style={{ 
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: (isDragging || isPinching) ? 'none' : 'transform 0.2s ease',
            maxWidth: '95%',
            maxHeight: '85%',
            touchAction: 'none'
          }}
          className="object-contain select-none"
          draggable={false}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && scale === 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[85vw] overflow-x-auto p-2 scrollbar-hide z-20">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedIndex(idx); setScale(1); setPosition({ x: 0, y: 0 }); }}
              className={`w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                idx === selectedIndex ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-transparent hover:border-gray-500'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-ink-400 text-xs opacity-50 select-none z-10">
        {scale === 1 ? '🖱️ Scroll to zoom • Pinch to zoom' : '✋ Drag to pan • Double tap to reset'}
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<GameListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("game_listings").select("*, seller:profiles(*), category:categories(*)").eq("id", id).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setListing(data as GameListing);
      const revRes = await supabase.from("reviews").select("*, reviewer:profiles(full_name, username, avatar_url)").eq("reviewee_id", (data as GameListing).seller_id).order("created_at", { ascending: false });
      setReviews((revRes.data as Review[]) ?? []);
      setLoading(false);
      if (!isOwnerView(data as GameListing, user?.id)) {
        const sessionId = getOrCreateSessionId();
        const { data: newCount } = await supabase.rpc("record_listing_view", {
          p_listing_id: id,
          p_session_id: sessionId,
        });
        if (typeof newCount === "number") {
          setListing((prev) => (prev ? { ...prev, view_count: newCount } : prev));
        }
      }
    })();
  }, [id, user?.id]);

  const handleImageClick = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!listing) return <div className="mx-auto max-w-md py-16 text-center"><p className="text-ink-400">Listing not found.</p><Link to="/browse" className="btn-primary mt-4 inline-flex">Browse IDs</Link></div>;

  const seller = listing.seller as Profile | undefined;
  const images = listing.images?.length ? listing.images : ["https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=900"];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isOwn = user?.id === listing.seller_id;
  const canBuy = !!user && !isOwn && (listing.status === "active" || listing.status === "approved");

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-4"><ArrowLeft size={16} /> Go back</button>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div 
              className="card overflow-hidden cursor-zoom-in relative group"
              onClick={() => handleImageClick(activeImg)}
            >
              <img 
                src={images[activeImg]} 
                alt={listing.title} 
                className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {activeImg + 1} / {images.length}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg transition-opacity">
                  🔍 Click to zoom
                </span>
              </div>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImg(i)} 
                    className={classNames(
                      "h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all hover:scale-105",
                      activeImg === i ? "border-primary-500 ring-2 ring-primary-500/50" : "border-ink-700 hover:border-ink-500"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="badge bg-primary-500/15 text-primary-300 border border-primary-500/20">{listing.game_name}</span>
                <StatusBadge status={listing.status} />
                {listing.is_featured && <span className="badge bg-accent-500/15 text-accent-300 border border-accent-500/20"><Star size={12} className="fill-accent-300" /> Featured</span>}
              </div>
              <h1 className="font-display text-2xl font-extrabold text-white">{listing.title}</h1>
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="font-display text-3xl font-extrabold text-primary-400 mt-3">{formatBDT(listing.price)}</p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                {listing.account_level != null && <Info label="Level" value={String(listing.account_level)} />}
                {listing.rank_tier && <Info label="Rank" value={listing.rank_tier} icon={TrendingUp} />}
                {listing.server_region && <Info label="Region" value={listing.server_region} />}
                {listing.follower_count != null && <Info label="Followers" value={listing.follower_count.toLocaleString()} />}
                {listing.total_likes != null && <Info label="Total Likes" value={listing.total_likes.toLocaleString()} />}
                <Info label="Views" value={String(listing.view_count)} icon={Eye} />
              </div>
              {canBuy && (
                <div className="mt-5 space-y-2">
                  <button onClick={() => navigate(`/checkout/${listing.id}`)} className="btn-primary w-full">Buy Now — {formatBDT(listing.price)}</button>
                  <Link to={`/messages?listing=${listing.id}`} className="btn-secondary w-full"><MessageSquare size={16} /> Message Seller</Link>
                </div>
              )}
              {isOwn && <div className="rounded-xl bg-warning-500/10 border border-warning-500/20 p-3 text-sm text-warning-400 mt-4">This is your own listing.</div>}
              {!user && <Link to="/login" className="btn-primary w-full mt-5">Log in to buy</Link>}
            </div>
            {seller && (
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-3">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">{(seller.full_name ?? seller.username)?.[0]?.toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5"><span className="font-semibold text-white">{seller.full_name ?? seller.username}</span>{seller.is_verified && <ShieldCheck size={15} className="text-success-400" />}</div>
                    <div className="flex items-center gap-2 text-xs text-ink-400 mt-0.5"><span className="flex items-center gap-0.5 text-warning-400"><Star size={11} className="fill-warning-400" /> {Number(seller.trust_score).toFixed(1)}</span><span>•</span><span>{seller.total_sales} sales</span></div>
                  </div>
                  <Link to="/profile" className="btn-ghost text-xs">View</Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3">Description</h3>
            {listing.description ? <p className="text-sm text-ink-300 whitespace-pre-line leading-relaxed">{listing.description}</p> : <p className="text-sm text-ink-500">No description provided.</p>}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-white">Seller Reviews</h3>{reviews.length > 0 && <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/20"><Star size={12} className="fill-warning-400" /> {avgRating.toFixed(1)} ({reviews.length})</span>}</div>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <div key={r.id} className="border-b border-ink-800 pb-3 last:border-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{r.reviewer?.full_name ?? r.reviewer?.username ?? "Anonymous"}</span><span className="text-xs text-ink-500">{timeAgo(r.created_at)}</span></div>
                    <div className="flex mt-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-warning-400 fill-warning-400" : "text-ink-700"} />)}</div>
                    {r.comment && <p className="text-sm text-ink-300 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-500">No reviews yet.</p>}
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isModalOpen && (
        <ImageGalleryModal
          images={images}
          currentIndex={modalImageIndex}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Eye }) {
  return <div className="rounded-lg bg-ink-800 p-3"><p className="text-xs text-ink-500">{label}</p><p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">{Icon && <Icon size={14} className="text-primary-400" />}{value}</p></div>;
}

function isOwnerView(listing: GameListing, userId: string | undefined): boolean {
  return !!userId && userId === listing.seller_id;
}

const SESSION_KEY = "gh_viewer_session";

function getOrCreateSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
