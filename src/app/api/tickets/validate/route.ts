import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const authHeader = request.headers.get('authorization');
    

    if (!userId || !userEmail) {
        return NextResponse.json(
            { 
                message: '사용자 인증 정보가 없습니다.',
                code: 'UNAUTHORIZED',
                debug: {
                    headers: Object.fromEntries(request.headers.entries())
                }
            },
            { status: 401 }
        );
    }

    try {
        const now = new Date();
        const ticketQuery = `
            SELECT ut.*, pp.name as plan_name, pp.features
            FROM user_tickets ut
            JOIN product_plans pp ON ut.product_plan_id = pp.id
            WHERE ut.user_id = $1
            AND ut.status = 'active'
            AND ut.start_date <= $2
            AND (
                ut.end_date IS NULL 
                OR ut.end_date >= $2
            )
            AND (
                ut.remaining_uses IS NULL 
                OR ut.remaining_uses > 0
            )
            AND pp.product_id = 1
            ORDER BY ut.created_at DESC
            LIMIT 1
        `;

        const result = await pool.query(ticketQuery, [parseInt(userId), now]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { 
                    error: '유효한 이용권이 없습니다.',
                    code: 'NO_VALID_TICKET',
                    redirectUrl: '/payment?product_id=1'
                },
                { status: 403 }
            );
        }

        const ticket = result.rows[0];

        // 이용권 사용 기록 추가 (선택적)
        if (ticket.remaining_uses !== null) {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // 사용 기록 추가
                await client.query(
                    `INSERT INTO ticket_usage_logs (
                        user_ticket_id,
                        description
                    ) VALUES ($1, $2)`,
                    [ticket.id, 'API 접근']
                );

                // 남은 사용 횟수 감소
                await client.query(
                    `UPDATE user_tickets
                    SET remaining_uses = remaining_uses - 1
                    WHERE id = $1
                    AND remaining_uses > 0`,
                    [ticket.id]
                );

                await client.query('COMMIT');

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        return NextResponse.json({
            data: {
                ticketId: ticket.id,
                planName: ticket.plan_name,
                startDate: ticket.start_date,
                endDate: ticket.end_date,
                remainingUses: ticket.remaining_uses,
                features: ticket.features
            }
        });

    } catch (error) {
        console.error('[티켓 검증 API] 처리 중 오류 발생:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { message: '서버 오류가 발생했습니다', error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: '알 수 없는 오류가 발생했습니다' },
            { status: 500 }
        );
    }
} 