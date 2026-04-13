// services/frontend/src/pages/matches.tsx
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

interface Match {
	id: string;
	createdAt: string;
	player1: { id: string; username: string; email: string };
	player2: { id: string; username: string; email: string };
	score1: number;
	score2: number;
	winner: { id: string; username: string } | null;
	status: string;
	abandonedBy: string | null;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface Stats {
	totalMatches: number;
	wins: number;
	losses: number;
	winRate: number;
}

export default function Matches() {
	const { isAuthenticated, isLoading, user } = useContext(AuthContext);
	const router = useRouter();
	const [matches, setMatches] = useState<Match[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	useEffect(() => {
		if (!user) return;

		const fetchData = async () => {
			setLoading(true);
			try {
				const [matchesRes, statsRes] = await Promise.all([
					axios.get(`/api/matches/me?page=${page}&limit=10`),
					axios.get("/api/matches/me/stats"),
				]);

				setMatches(matchesRes.data.data);
				setPagination(matchesRes.data.pagination);
				setStats(statsRes.data);
			} catch (error) {
				if (!axios.isAxiosError(error) || error.response?.status !== 401) {
					console.error("Failed to fetch match data:", error);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [page, user]);

	if (isLoading || !isAuthenticated || !user) {
		return null;
	}

	return (
		<div className="max-w-6xl mx-auto pt-20 px-4 pb-16">
			<h1
				className="text-4xl font-bold text-center mb-8 glow-text"
				style={{ color: "var(--tron-blue)" }}
			>
				MATCH HISTORY
			</h1>

			{/* Stats Cards */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<div className="p-6 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(0,210,255,0.2)]">
						<p className="text-sm text-gray-400 uppercase tracking-wide">Total Matches</p>
						<p className="text-3xl font-bold text-white mt-2">{stats.totalMatches}</p>
					</div>
					<div className="p-6 bg-black/60 border-2 border-green-500 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.2)]">
						<p className="text-sm text-gray-400 uppercase tracking-wide">Wins</p>
						<p className="text-3xl font-bold text-green-500 mt-2">{stats.wins}</p>
					</div>
					<div className="p-6 bg-black/60 border-2 border-red-500 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(255,0,0,0.2)]">
						<p className="text-sm text-gray-400 uppercase tracking-wide">Losses</p>
						<p className="text-3xl font-bold text-red-500 mt-2">{stats.losses}</p>
					</div>
					<div className="p-6 bg-black/60 border-2 border-[var(--tron-orange)] rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(255,157,0,0.2)]">
						<p className="text-sm text-gray-400 uppercase tracking-wide">Win Rate</p>
						<p className="text-3xl font-bold text-[var(--tron-orange)] mt-2">
							{stats.winRate.toFixed(1)}%
						</p>
					</div>
				</div>
			)}

			{/* Match List */}
			{loading ? (
				<div className="text-center text-white py-16">
					<div className="w-16 h-16 border-4 border-[var(--tron-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p>Loading matches...</p>
				</div>
			) : matches.length === 0 ? (
				<div className="text-center text-white p-16 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl">
					<p className="text-xl mb-4">No matches found</p>
					<p className="text-gray-400 mb-6">Play your first game to see your match history!</p>
					<button
						onClick={() => router.push("/game")}
						className="px-6 py-3 bg-[var(--tron-blue)] text-black font-bold rounded-lg hover:bg-white transition-all duration-300"
					>
						Play Now
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{matches.map((match) => {
						const isPlayer1 = match.player1.id === user.id;
						const myScore = isPlayer1 ? match.score1 : match.score2;
						const opponentScore = isPlayer1 ? match.score2 : match.score1;
						const opponent = isPlayer1 ? match.player2 : match.player1;
						const didWin = match.winner?.id === user.id;
						const wasDraw = !match.winner;

						return (
							<div
								key={match.id}
								className={`p-6 bg-black/60 border-2 rounded-xl backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
									didWin
										? "border-green-500 hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
										: wasDraw
										? "border-gray-500 hover:shadow-[0_0_20px_rgba(128,128,128,0.3)]"
										: "border-red-500 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
								}`}
							>
								<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
									<div className="flex-grow">
										<div className="flex items-center gap-3 mb-2">
											<p className="text-white text-lg font-bold">
												{user.username}
											</p>
											<span className="text-gray-400">vs</span>
											<p className="text-white text-lg font-bold">
												{opponent.username}
											</p>
										</div>
										<div className="flex items-center gap-4 text-sm text-gray-400">
											<span>{new Date(match.createdAt).toLocaleDateString()}</span>
											<span>•</span>
											<span>{new Date(match.createdAt).toLocaleTimeString()}</span>
											{match.status === "ABANDONED" && match.abandonedBy && (
												<>
													<span>•</span>
													<span className="text-yellow-500">
													    Abandoned by {match.abandonedBy === user.id
       													        ? "you"
                												: match.player1.id === match.abandonedBy
                    												    ? match.player1.username
										                       		    : match.player2.username}
													</span>
												</>
											)}
										</div>
									</div>
									<div className="flex items-center gap-6">
										<div className="text-center">
											<p
												className={`text-3xl font-bold ${
													didWin ? "text-green-500" : wasDraw ? "text-gray-400" : "text-red-500"
												}`}
											>
												{myScore} - {opponentScore}
											</p>
										</div>
										<div className="text-center min-w-[100px]">
											<p
												className={`text-sm font-bold uppercase tracking-wide ${
													didWin
														? "text-green-500"
														: wasDraw
														? "text-gray-400"
														: "text-red-500"
												}`}
											>
												{didWin ? "Victory" : wasDraw ? "Draw" : "Defeat"}
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex justify-center items-center gap-4 mt-8">
					<button
						disabled={!pagination.hasPreviousPage}
						onClick={() => setPage(page - 1)}
						className="px-6 py-2 bg-[var(--tron-blue)] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-300"
					>
						Previous
					</button>
					<span className="text-white font-medium">
						Page {pagination.page} of {pagination.totalPages}
					</span>
					<button
						disabled={!pagination.hasNextPage}
						onClick={() => setPage(page + 1)}
						className="px-6 py-2 bg-[var(--tron-blue)] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all duration-300"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}
