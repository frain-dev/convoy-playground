import { ImageResponse } from 'next/server';

export const runtime = 'edge';

export const alt = 'Convoy Playground — Receive, Test & Debug Webhook Events';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					background: 'linear-gradient(135deg, #FAFAFE 0%, #EEF0FF 50%, #FAFAFE 100%)',
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					fontFamily: 'Inter, sans-serif',
					padding: '60px'
				}}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '24px'
					}}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '16px',
							marginBottom: '8px'
						}}>
						<div
							style={{
								width: '56px',
								height: '56px',
								borderRadius: '12px',
								background: '#2E3FF5',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
								fontSize: '28px',
								fontWeight: 700
							}}>
							C
						</div>
						<span style={{ fontSize: '36px', fontWeight: 700, color: '#1B1D27' }}>Convoy Playground</span>
					</div>

					<p
						style={{
							fontSize: '24px',
							color: '#656780',
							textAlign: 'center',
							maxWidth: '700px',
							lineHeight: 1.5
						}}>
						Receive, test, and debug webhook events in real time. Inspect headers, payloads, and delivery attempts.
					</p>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '32px',
							marginTop: '16px'
						}}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								background: 'white',
								border: '1px solid #E0E2EE',
								borderRadius: '8px',
								padding: '12px 24px',
								fontSize: '18px',
								color: '#1B1D27'
							}}>
							<span style={{ color: '#22C55E', fontSize: '14px' }}>●</span>
							Real-time events
						</div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								background: 'white',
								border: '1px solid #E0E2EE',
								borderRadius: '8px',
								padding: '12px 24px',
								fontSize: '18px',
								color: '#1B1D27'
							}}>
							<span style={{ color: '#2E3FF5', fontSize: '14px' }}>●</span>
							Payload inspection
						</div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								background: 'white',
								border: '1px solid #E0E2EE',
								borderRadius: '8px',
								padding: '12px 24px',
								fontSize: '18px',
								color: '#1B1D27'
							}}>
							<span style={{ color: '#F59E0B', fontSize: '14px' }}>●</span>
							Delivery debugging
						</div>
					</div>
				</div>

				<div
					style={{
						position: 'absolute',
						bottom: '40px',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						fontSize: '16px',
						color: '#9496AD'
					}}>
					Powered by Convoy — The open-source webhooks gateway
				</div>
			</div>
		),
		{ ...size }
	);
}
