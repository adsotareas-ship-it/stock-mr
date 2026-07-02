export const getAssetImage = (asset) => {
  if (asset && asset.imageUrl) return asset.imageUrl;
  
  const category = asset && asset.category ? asset.category.toLowerCase() : 'default';
  
  const defaults = {
    laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&auto=format&fit=crop&q=80',
    display: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=80',
    networking: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=150&auto=format&fit=crop&q=80',
    server: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150&auto=format&fit=crop&q=80',
    tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=150&auto=format&fit=crop&q=80',
    mobile: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=150&auto=format&fit=crop&q=80',
    default: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&auto=format&fit=crop&q=80',
  };
  
  if (category.includes('laptop') || category.includes('portatil') || category.includes('computador') || category.includes('pc') || category.includes('láp')) return defaults.laptop;
  if (category.includes('display') || category.includes('pantalla') || category.includes('monitor') || category.includes('pantall')) return defaults.display;
  if (category.includes('network') || category.includes('redes') || category.includes('router') || category.includes('switch') || category.includes('modem') || category.includes('red')) return defaults.networking;
  if (category.includes('server') || category.includes('servidor') || category.includes('servid')) return defaults.server;
  if (category.includes('tablet') || category.includes('ipad') || category.includes('tab')) return defaults.tablet;
  if (category.includes('mobile') || category.includes('movil') || category.includes('móvil') || category.includes('celular') || category.includes('telefono') || category.includes('teléfono')) return defaults.mobile;

  return defaults.default;
};
