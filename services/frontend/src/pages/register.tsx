import { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';

export default function Register() {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { login } = useContext(AuthContext);
	const router = useRouter();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validateForm = (): boolean => {
		const username = formData.username.trim();
		const email = formData.email.trim();

		if (username.length < 3) {
			setError('Username must be at least 3 characters long');
			return false;
		}
		if (username.length > 20) {
			setError('Username must not exceed 20 characters');
			return false;
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			setError('Username can only contain letters, numbers, underscores, and hyphens');
			return false;
		}
		if (!email) {
			setError('Email is required');
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setError('Please enter a valid email address');
			return false;
		}
		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters long');
			return false;
		}
		if (formData.password.length > 50) {
			setError('Password must not exceed 50 characters');
			return false;
		}
		if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			setError('Password must contain uppercase, lowercase letters and a number');
			return false;
		}
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		if (!validateForm()) {
			setLoading(false);
			return;
		}

		try {
			const normalizedFormData = {
				username: formData.username.trim(),
				email: formData.email.trim(),
				password: formData.password,
			};

			await axios.post('/api/auth/register', normalizedFormData, {
			headers: { 'Content-Type': 'application/json' },
		});

		await axios.post('/api/auth/login', {
			email: normalizedFormData.email,
			password: formData.password,
		}, {
			headers: { 'Content-Type': 'application/json' },
		});

		await login();
		router.push('/');
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				setError(err.response?.data?.message || "Registration failed");
			} else {
				setError("An unexpected error occurred");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center pt-20">
			<div className="w-full max-w-md p-8 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(0,210,255,0.2)]">
				<h2
					className="text-3xl font-bold text-center mb-8 glow-text"
					style={{ color: "var(--tron-blue)" }}
				>
					USER REGISTRATION
				</h2>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label className="block text-sm font-medium mb-2 text-white">
							USERNAME
						</label>
						<input
							type="text"
							name="username"
							required
							minLength={3}
							maxLength={20}
							className="w-full px-4 py-2 bg-black border border-[var(--tron-blue)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--tron-blue)] transition-all"
							value={formData.username}
							onChange={handleChange}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2 text-white">
							EMAIL
						</label>
						<input
							type="email"
							name="email"
							required
							className="w-full px-4 py-2 bg-black border border-[var(--tron-blue)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--tron-blue)] transition-all"
							value={formData.email}
							onChange={handleChange}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2 text-white">
							PASSWORD
						</label>
						<input
							type="password"
							name="password"
							required
							minLength={8}
							className="w-full px-4 py-2 bg-black border border-[var(--tron-blue)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--tron-blue)] transition-all"
							value={formData.password}
							onChange={handleChange}
						/>
						<p className="text-xs text-gray-400 mt-1">
							Password must be at least 8 characters and include uppercase, lowercase letters and a number.
						</p>
					</div>

					{error && (
						<p className="text-red-500 text-sm mt-2">{error}</p>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 px-4 mt-4 bg-[var(--tron-blue)] text-black font-bold rounded-lg hover:bg-white transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.4)] disabled:opacity-50"
					>
						{loading ? "INITIALIZING..." : "REGISTER"}
					</button>
				</form>

				<p className="text-center text-sm text-white mt-4">
					Already have an account?{" "}
					<a href="/login" className="text-[var(--tron-blue)] hover:underline">
						Login here
					</a>
				</p>
			</div>
		</div>
	);
}