import { notFound } from "next/navigation";
import ReviewRunner from "../../components/ReviewRunner";
import { getReview } from "../../lib/reviews";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const review = await getReview(id);
    return review
        ? { title: `${review.judul} — Review Mode` }
        : { title: "Review tidak ditemukan" };
}

export default async function ReviewDetail({ params }) {
    const { id } = await params;
    const review = await getReview(id);
    if (!review) notFound();
    return <ReviewRunner review={review} />;
}