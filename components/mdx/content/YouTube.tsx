export const YouTube = ({ id }: { id: string }) => {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-[#222] relative w-full pt-[56.25%]">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
