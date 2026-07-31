import { notFound } from "next/navigation";
import QuizRunner from "../../components/QuizRunner";
import { getQuizSet } from "../../lib/quiz";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const set = await getQuizSet(slug);
    return set
        ? { title: `${set.judul} — Quiz Quick Review` }
        : { title: "Quiz tidak ditemukan" };
}

export default async function QuizDetail({ params }) {
    const { slug } = await params;
    const set = await getQuizSet(slug);
    if (!set) notFound();
    return <QuizRunner quizSet={set} />;
}
