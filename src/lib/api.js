import { supabase } from './supabase'

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// Auth
export const register = (params) => rpc('register_participant', params)
export const login = (params) => rpc('login_participant', params)
export const logout = (token) => rpc('logout_participant', { p_token: token })

// Matches
export const getMatches = () => rpc('get_matches', {})
export const getMatch = (matchId) => rpc('get_match', { p_match_id: matchId })

// Predictions
export const savePrediction = (token, matchId, homeGoals, awayGoals) =>
  rpc('save_prediction', { p_token: token, p_match_id: matchId, p_home: homeGoals, p_away: awayGoals })

export const getMyPredictions = (token) =>
  rpc('get_my_predictions', { p_token: token })

export const getMatchPredictions = (token, matchId) =>
  rpc('get_match_predictions', { p_token: token, p_match_id: matchId })

// Standings
export const getStandings = () => rpc('get_standings', {})

// Admin
export const adminSetResult = (token, matchId, home, away) =>
  rpc('admin_set_result', { p_token: token, p_match_id: matchId, p_home: home, p_away: away })

export const adminCreateMatch = (token, params) =>
  rpc('admin_create_match', { p_token: token, ...params })

export const adminUpdateMatch = (token, matchId, params) =>
  rpc('admin_update_match', { p_token: token, p_match_id: matchId, ...params })

export const adminDeleteMatch = (token, matchId) =>
  rpc('admin_delete_match', { p_token: token, p_match_id: matchId })

export const adminListParticipants = (token) =>
  rpc('admin_list_participants', { p_token: token })

export const adminDeleteParticipant = (token, participantId) =>
  rpc('admin_delete_participant', { p_token: token, p_participant_id: participantId })

export const adminRecalculate = (token) =>
  rpc('admin_recalculate', { p_token: token })

export const adminReset = (token, deleteParticipants = false) =>
  rpc('admin_reset', { p_token: token, p_delete_participants: deleteParticipants })
