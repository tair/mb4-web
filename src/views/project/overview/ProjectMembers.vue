<script setup>
import { useProjectStore } from "@/stores/storeProjectDetails.js";
const projectStore = useProjectStore();
</script>

<template>
  <div>
    <h3>Members</h3>

    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th scope="col">Member Name</th>
          <th scope="col">Taxa</th>
          <th scope="col">Specimens</th>
          <th scope="col">Media</th>
          <th scope="col">Media Notes</th>
          <th scope="col">Chars</th>
          <th scope="col">Char Notes</th>
          <th scope="col">Char Media</th>
          <th scope="col">Char Labels</th>
          <th scope="col">Cell Scorings (scored, NPA, "-")</th>
          <th scope="col">Cell Notes</th>
          <th scope="col">Cell Media</th>
          <th scope="col">Cell Labels</th>
          <th scope="col">Rules</th>
        </tr>
      </thead>
      <tbody>
        <tr :key="idx" v-for="(member, idx) in projectStore.overview.members">
          <td scope="row">
            <div class="fw-bold">{{ member.fname + " " + member.lname }}</div>

            <small v-if="member.administrator == '1'" class="text-danger"
              >Project Administrator</small
            >

            <div v-else-if="member.membership_status == '1'">
              <small v-if="member.member_role == '1'"> Observer</small>
              <small v-else-if="member.member_role == '2'">
                Character annotater</small
              >
              <small v-else-if="member.member_role == '3'">
                Bibliography maintainer</small
              >
              <small v-else-if="member.member_role == '0'">
                Full membership</small
              >
            </div>
          </td>
          <td>{{ member.taxa }}</td>
          <td>{{ member.specimens }}</td>
          <td>{{ member.media }}</td>
          <td>{{ member.media_notes }}</td>
          <td>{{ member.characters }}</td>
          <td>{{ member.character_notes }}</td>
          <td>{{ member.character_media }}</td>
          <td>{{ member.character_media_labels }}</td>
          <td>
            {{ member.cell_scorings }}<br />
            ({{ member.cell_scorings_scored }}, {{ member.cell_scorings_npa }},
            {{ member.cell_scorings_not }})
          </td>
          <td>{{ member.cell_notes }}</td>
          <td>{{ member.cell_media }}</td>
          <td>{{ member.cell_media_labels }}</td>
          <td>{{ member.rules }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
